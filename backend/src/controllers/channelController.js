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

        const channels = await Channel.find({ workspace: workspaceId }).sort({ isGeneral: -1, name: 1 });
        res.json(channels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const createChannel = async (req, res) => {
    try {
        const { workspaceId, name } = req.body;
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

        const channel = await Channel.create({
            name: name.trim(),
            workspace: workspaceId,
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
