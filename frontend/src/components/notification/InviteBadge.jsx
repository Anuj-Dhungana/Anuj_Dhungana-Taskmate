import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { inviteAPI } from '../../api/invites';

const InviteBadge = () => {
    const [inviteCount, setInviteCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInviteCount();
        
        // Poll for updates every 30 seconds
        const interval = setInterval(fetchInviteCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchInviteCount = async () => {
        try {
            const res = await inviteAPI.getMyInvites();
            const invites = res.data || [];
            setInviteCount(invites.length);
        } catch (error) {
            console.error('Failed to fetch invite count:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null;
    }

    return (
        <Link
            to="/invites"
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Pending Invites"
        >
            <Mail className="w-5 h-5 text-gray-600" />
            {inviteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {inviteCount > 9 ? '9+' : inviteCount}
                </span>
            )}
        </Link>
    );
};

export default InviteBadge;
