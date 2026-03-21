import Channel from '../models/Channel.js';
import Workspace from '../models/Workspace.js';
import Message from '../models/Message.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getWorkspaceAndMember = async (workspaceId, userId) => {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
        return { workspace: null, member: null };
    }
    const member = workspace.members.find(
        (m) => m.user.toString() === userId.toString()
    );
    return { workspace, member };
};

const isModerator = (member) => member && (member.role === 'owner' || member.role === 'admin');

export const getWorkspaceChannels = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId || req.query.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const { workspace, member } = await getWorkspaceAndMember(workspaceId, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!member) return res.status(403).json({ message: "Not authorized" });

        const channels = await Channel.find({ 
            workspace: workspaceId, 
            type: { $in: ['channel', null] },
            $or: [
                { members: { $exists: false } },
                { members: { $size: 0 } },
                { members: req.user._id }
            ]
        }).sort({ isGeneral: -1, name: 1 });
        res.json(channels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getWorkspaceDMs = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId || req.query.workspaceId;
        if (!workspaceId) {
            return res.status(400).json({ message: "workspaceId is required" });
        }

        const { workspace, member } = await getWorkspaceAndMember(workspaceId, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!member) return res.status(403).json({ message: "Not authorized" });

        const dms = await Channel.find({
            workspace: workspaceId,
            type: 'dm',
            members: req.user._id
        })
            .populate('members', 'fullname email avatar')
            .sort({ updatedAt: -1 });

        res.json(dms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { workspaceId, name, members = [] } = req.body;
        if (!workspaceId || !name?.trim()) {
            return res.status(400).json({ message: "workspaceId and name are required" });
        }

        const { workspace, member } = await getWorkspaceAndMember(workspaceId, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!isModerator(member)) return res.status(403).json({ message: "Only admins can manage channels" });

        const existing = await Channel.findOne({
            workspace: workspaceId,
            name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') }
        });
        if (existing) {
            return res.status(400).json({ message: "Channel already exists" });
        }

        let channelMembers = [];
        if (Array.isArray(members) && members.length > 0) {
            // Ensure uniqueness and include the creator
            channelMembers = [...new Set([...members, req.user._id.toString()])];
        }

        const channel = await Channel.create({
            name: name.trim(),
            workspace: workspaceId,
            type: 'channel',
            members: channelMembers,
            isGeneral: false
        });

        res.status(201).json(channel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const renameChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: "name is required" });
        }

        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.type === 'dm') {
            return res.status(400).json({ message: "Cannot rename a direct message" });
        }
        if (channel.isGeneral) {
            return res.status(400).json({ message: "Cannot rename the general channel" });
        }

        const { workspace, member } = await getWorkspaceAndMember(channel.workspace, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!isModerator(member)) return res.status(403).json({ message: "Only admins can manage channels" });

        const existing = await Channel.findOne({
            workspace: channel.workspace,
            name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') }
        });
        if (existing && existing._id.toString() !== id) {
            return res.status(400).json({ message: "Channel already exists" });
        }

        channel.name = name.trim();
        await channel.save();
        res.json(channel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.type === 'dm') {
            return res.status(400).json({ message: "Cannot delete a direct message" });
        }
        if (channel.isGeneral) {
            return res.status(400).json({ message: "Cannot delete the general channel" });
        }

        const { workspace, member } = await getWorkspaceAndMember(channel.workspace, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!isModerator(member)) return res.status(403).json({ message: "Only admins can manage channels" });

        await Message.deleteMany({ channelId: channel._id });
        await channel.deleteOne();

        res.json({ message: "Channel deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const createOrGetDM = async (req, res) => {
    try {
        const { workspaceId, memberId } = req.body;
        if (!workspaceId || !memberId) {
            return res.status(400).json({ message: "workspaceId and memberId are required" });
        }
        if (memberId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot create a DM with yourself" });
        }

        const { workspace, member } = await getWorkspaceAndMember(workspaceId, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!member) return res.status(403).json({ message: "Not authorized" });

        const targetIsMember = workspace.members.some(
            (m) => m.user.toString() === memberId.toString()
        );
        if (!targetIsMember) {
            return res.status(404).json({ message: "User is not in this workspace" });
        }

        const userIds = [req.user._id.toString(), memberId.toString()].sort();
        const existing = await Channel.findOne({
            workspace: workspaceId,
            type: 'dm',
            members: { $all: userIds, $size: 2 }
        }).populate('members', 'fullname email avatar');

        if (existing) {
            return res.json(existing);
        }

        const dm = await Channel.create({
            name: `dm-${userIds[0]}-${userIds[1]}`,
            workspace: workspaceId,
            type: 'dm',
            members: userIds,
            isGeneral: false
        });

        const populated = await dm.populate('members', 'fullname email avatar');
        res.status(201).json(populated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const addMembersToChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const { memberIds } = req.body;
        if (!memberIds || !Array.isArray(memberIds)) {
            return res.status(400).json({ message: "memberIds array is required" });
        }

        const channel = await Channel.findById(id);
        if (!channel) return res.status(404).json({ message: "Channel not found" });
        if (channel.type === 'dm') {
            return res.status(400).json({ message: "Cannot add multiple members to a direct message" });
        }
        if (channel.isGeneral || !channel.members || channel.members.length === 0) {
            return res.status(400).json({ message: "Cannot explicitly add members to a public or general channel" });
        }

        const { workspace, member } = await getWorkspaceAndMember(channel.workspace, req.user._id);
        if (!workspace) return res.status(404).json({ message: "Workspace not found" });
        if (!isModerator(member)) {
            // Alternatively, allow any existing member of the private channel to add others.
            // For now, restricting to moderators (admins/owners) for better control.
            return res.status(403).json({ message: "Only admins can add members to channels" });
        }

        // Filter memberIds to ensure they are actually in the workspace
        const validWorkspaceMemberIds = workspace.members.map(m => m.user.toString());
        const validIdsToAdd = memberIds.filter(id => validWorkspaceMemberIds.includes(id));

        if (validIdsToAdd.length === 0) {
            return res.status(400).json({ message: "No valid workspace members provided to add" });
        }

        // Add to channel
        const updatedChannel = await Channel.findByIdAndUpdate(
            id,
            { $addToSet: { members: { $each: validIdsToAdd } } },
            { new: true }
        );

        res.json(updatedChannel);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
