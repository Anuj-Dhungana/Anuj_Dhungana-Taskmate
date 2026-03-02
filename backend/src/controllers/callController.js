import Workspace from '../models/Workspace.js';
import { generateToken04 } from '../utils/zegoServerAssistant.js';

const LOGIN_PRIVILEGE_KEY = 1;
const PUBLISH_PRIVILEGE_KEY = 2;

export const createCallToken = async (req, res) => {
    try {
        const roomID = String(req.body?.roomID || '').trim();
        const workspaceId = String(req.body?.workspaceId || '').trim();

        if (!roomID) {
            return res.status(400).json({ message: 'roomID is required' });
        }

        if (workspaceId) {
            const workspace = await Workspace.findById(workspaceId).select('members.user');
            if (!workspace) {
                return res.status(404).json({ message: 'Workspace not found' });
            }

            const isMember = workspace.members.some(
                (member) => String(member.user) === String(req.user?._id || '')
            );

            if (!isMember) {
                return res.status(403).json({ message: 'Not authorized for this workspace call' });
            }
        }

        const appID = Number(process.env.ZEGO_APP_ID);
        const serverSecret = String(process.env.ZEGO_SERVER_SECRET || '').trim();
        const effectiveTimeInSeconds = Number(process.env.ZEGO_TOKEN_EXPIRES_IN || 3600);

        if (!appID || Number.isNaN(appID)) {
            return res.status(500).json({ message: 'ZEGO_APP_ID is not configured correctly' });
        }

        if (!serverSecret) {
            return res.status(500).json({ message: 'ZEGO_SERVER_SECRET is not configured' });
        }

        const userID = String(req.user?._id || '');
        const userName = String(req.user?.fullname || `User-${userID}`);
        const payload = JSON.stringify({
            room_id: roomID,
            privilege: {
                [LOGIN_PRIVILEGE_KEY]: 1,
                [PUBLISH_PRIVILEGE_KEY]: 1,
            },
            stream_id_list: null,
        });

        const token = generateToken04(
            appID,
            userID,
            serverSecret,
            effectiveTimeInSeconds,
            payload
        );

        res.json({
            appID,
            roomID,
            userID,
            userName,
            token,
        });
    } catch (error) {
        console.error('createCallToken Error:', error);
        res.status(500).json({ message: 'Failed to create call token' });
    }
};
