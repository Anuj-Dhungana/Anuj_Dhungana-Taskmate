import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PendingInvites from '../components/workspace/PendingInvites';

const PendingInvitesPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <PendingInvites />
            </div>
        </div>
    );
};

export default PendingInvitesPage;
