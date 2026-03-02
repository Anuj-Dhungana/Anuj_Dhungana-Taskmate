import { randomBytes } from 'crypto';
import Meeting from '../models/Meeting.js';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';

const ALLOWED_DURATIONS = [30, 45, 60, 90];

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

        const duration = Number(durationMinutes);
        if (!ALLOWED_DURATIONS.includes(duration)) {
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

        let project = null;
        if (projectId) {
            project = await Project.findById(projectId);
            if (!project || String(project.workspace) !== String(workspace._id)) {
                return res.status(404).json({ message: 'Project not found in this workspace' });
            }
        }

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
        attendeeIds.add(String(req.user._id));

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
            attendees: Array.from(attendeeIds).map((userId) => ({ user: userId })),
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
