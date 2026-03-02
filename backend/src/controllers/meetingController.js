import { randomBytes } from 'crypto';
import Meeting from '../models/Meeting.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 1440;

const populateMeetingQuery = (query) =>
    query
        .populate('project', 'name projectColor')
        .populate('createdBy', 'fullname email avatar')
        .populate('attendees.user', 'fullname email avatar');

const createMeetingCode = () => {
    const timestamp = Date.now().toString(36).slice(-6).toUpperCase();
    const randomChunk = randomBytes(2).toString('hex').slice(0, 4).toUpperCase();
    return `TM-${timestamp}-${randomChunk}`;
};

const isWorkspaceMember = (workspace, userId) =>
    workspace?.members?.some((member) => String(member?.user) === String(userId));

const canManageMeeting = (workspace, meeting, userId) => {
    const member = workspace?.members?.find((item) => String(item?.user) === String(userId));
    if (!member) return false;
    return String(meeting?.createdBy) === String(userId) || ['owner', 'admin'].includes(member.role);
};

const buildAttendeeIds = ({ workspace, project, userId }) => {
    const attendeeIds = new Set();

    if (project?.members?.length) {
        project.members.forEach((member) => {
            if (member?.user) {
                attendeeIds.add(String(member.user));
            }
        });
    } else {
        workspace.members.forEach((member) => {
            if (member?.user) {
                attendeeIds.add(String(member.user));
            }
        });
    }

    attendeeIds.add(String(userId));
    return Array.from(attendeeIds).map((attendeeUserId) => ({ user: attendeeUserId }));
};

const resolveProjectForWorkspace = async ({ workspaceId, projectId }) => {
    if (!projectId) return null;
    const project = await Project.findById(projectId);
    if (!project || String(project.workspace) !== String(workspaceId)) {
        return null;
    }
    return project;
};

const normalizeDuration = (durationMinutes) => {
    const duration = Number(durationMinutes);
    if (!Number.isInteger(duration)) {
        return null;
    }
    if (duration < MIN_DURATION_MINUTES || duration > MAX_DURATION_MINUTES) {
        return null;
    }
    return duration;
};

export const createMeeting = async (req, res) => {
    try {
        const {
            workspaceId,
            projectId,
            title,
            description = '',
            startsAt,
            durationMinutes,
        } = req.body;

        if (!workspaceId) {
            return res.status(400).json({ message: 'workspaceId is required' });
        }

        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        if (!trimmedTitle) {
            return res.status(400).json({ message: 'Meeting title is required' });
        }

        const duration = normalizeDuration(durationMinutes);
        if (!duration) {
            return res.status(400).json({ message: 'Invalid meeting duration' });
        }

        const startDate = new Date(startsAt);
        if (Number.isNaN(startDate.getTime())) {
            return res.status(400).json({ message: 'Invalid meeting start time' });
        }
        if (startDate.getTime() < Date.now() - 60 * 1000) {
            return res.status(400).json({ message: 'Meetings must be scheduled in the future' });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        if (!isWorkspaceMember(workspace, req.user._id)) {
            return res.status(403).json({ message: 'You are not a member of this workspace' });
        }

        const project = await resolveProjectForWorkspace({
            workspaceId: workspace._id,
            projectId,
        });
        if (projectId && !project) {
            return res.status(404).json({ message: 'Project not found in this workspace' });
        }

        const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

        const meeting = await Meeting.create({
            title: trimmedTitle,
            description: typeof description === 'string' ? description.trim() : '',
            roomID: createMeetingCode(),
            workspace: workspace._id,
            project: project?._id || null,
            startsAt: startDate,
            endsAt: endDate,
            durationMinutes: duration,
            createdBy: req.user._id,
            attendees: buildAttendeeIds({ workspace, project, userId: req.user._id }),
        });

        const populatedMeeting = await populateMeetingQuery(Meeting.findById(meeting._id));

        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id.toString()}`).emit('meeting_created', {
            workspaceId: workspace._id.toString(),
            meeting: populatedMeeting,
        });

        res.status(201).json(populatedMeeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getMeetings = async (req, res) => {
    try {
        const { workspaceId, projectId } = req.query;

        if (!workspaceId && !projectId) {
            return res.status(400).json({ message: 'workspaceId or projectId is required' });
        }

        let workspace = null;
        let filter = {};

        if (projectId) {
            const project = await Project.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            workspace = await Workspace.findById(project.workspace);
            if (!workspace) {
                return res.status(404).json({ message: 'Workspace not found' });
            }
            if (!isWorkspaceMember(workspace, req.user._id)) {
                return res.status(403).json({ message: 'Not authorized to view meetings for this project' });
            }
            filter.project = project._id;

            if (workspaceId && String(workspace._id) !== String(workspaceId)) {
                return res.status(400).json({ message: 'projectId does not belong to workspaceId' });
            }
        } else {
            workspace = await Workspace.findById(workspaceId);
            if (!workspace) {
                return res.status(404).json({ message: 'Workspace not found' });
            }
            if (!isWorkspaceMember(workspace, req.user._id)) {
                return res.status(403).json({ message: 'Not authorized to view meetings for this workspace' });
            }
        }

        if (workspace) {
            filter.workspace = workspace._id;
        }

        const meetings = await populateMeetingQuery(
            Meeting.find(filter).sort({ startsAt: 1, createdAt: -1 })
        );

        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const updateMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const workspace = await Workspace.findById(meeting.workspace);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        if (!isWorkspaceMember(workspace, req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to manage this meeting' });
        }
        if (!canManageMeeting(workspace, meeting, req.user._id)) {
            return res.status(403).json({ message: 'Only the creator, owner, or admin can edit this meeting' });
        }

        const {
            title,
            description = '',
            startsAt,
            durationMinutes,
            projectId,
        } = req.body;

        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        if (!trimmedTitle) {
            return res.status(400).json({ message: 'Meeting title is required' });
        }

        const duration = normalizeDuration(durationMinutes);
        if (!duration) {
            return res.status(400).json({ message: 'Invalid meeting duration' });
        }

        const startDate = new Date(startsAt);
        if (Number.isNaN(startDate.getTime())) {
            return res.status(400).json({ message: 'Invalid meeting start time' });
        }
        if (startDate.getTime() < Date.now() - 60 * 1000) {
            return res.status(400).json({ message: 'Meetings must be scheduled in the future' });
        }

        const project = await resolveProjectForWorkspace({
            workspaceId: workspace._id,
            projectId,
        });
        if (projectId && !project) {
            return res.status(404).json({ message: 'Project not found in this workspace' });
        }

        meeting.title = trimmedTitle;
        meeting.description = typeof description === 'string' ? description.trim() : '';
        meeting.startsAt = startDate;
        meeting.endsAt = new Date(startDate.getTime() + duration * 60 * 1000);
        meeting.durationMinutes = duration;
        meeting.project = project?._id || null;
        meeting.attendees = buildAttendeeIds({ workspace, project, userId: req.user._id });

        await meeting.save();

        const updatedMeeting = await populateMeetingQuery(Meeting.findById(meeting._id));

        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id.toString()}`).emit('meeting_updated', {
            workspaceId: workspace._id.toString(),
            meeting: updatedMeeting,
        });

        res.json(updatedMeeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const deleteMeeting = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id);
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        const workspace = await Workspace.findById(meeting.workspace);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        if (!isWorkspaceMember(workspace, req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to manage this meeting' });
        }
        if (!canManageMeeting(workspace, meeting, req.user._id)) {
            return res.status(403).json({ message: 'Only the creator, owner, or admin can delete this meeting' });
        }

        const meetingId = meeting._id.toString();
        await meeting.deleteOne();

        const io = req.app.get('io');
        io?.to(`workspace_${workspace._id.toString()}`).emit('meeting_deleted', {
            workspaceId: workspace._id.toString(),
            meeting: { _id: meetingId },
        });

        res.json({ message: 'Meeting deleted successfully', meetingId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
