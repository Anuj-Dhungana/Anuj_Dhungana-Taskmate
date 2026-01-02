import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { User, Lock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const { userInfo, setCredentials } = useAuthStore();
    const navigate = useNavigate();

    const [fullname, setFullname] = useState('');
    const [password, setPassword] = useState('');
    const [is2FA, setIs2FA] = useState(false);

    // Load initial data
    useEffect(() => {
        if (userInfo) {
            setFullname(userInfo.fullname);
            setIs2FA(userInfo.twoFactorEnabled || false);
        }
    }, [userInfo]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('/api/auth/profile', { fullname, password });
            setCredentials({ ...userInfo, ...res.data }); // Update store
            toast.success('Profile updated!');
            setPassword(''); // Clear password field
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Update failed');
        }
    };

    const handleToggle2FA = async () => {
        try {
            const res = await axios.put('/api/auth/2fa/toggle');
            setIs2FA(res.data.twoFactorEnabled);
            
            // Update local storage so we remember 2FA is on
            const updatedUser = { ...userInfo, twoFactorEnabled: res.data.twoFactorEnabled };
            setCredentials(updatedUser);
            
            toast.success(res.data.message);
        } catch (err) {
            toast.error('Could not update 2FA settings');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
                
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6">
                    <ArrowLeft size={20} className="mr-2"/> Back to Dashboard
                </button>

                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <User className="text-blue-600"/> Profile Settings
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Left: Edit Details */}
                    <form onSubmit={handleUpdateProfile}>
                        <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded mt-1"
                                value={fullname} 
                                onChange={(e) => setFullname(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">New Password</label>
                            <input 
                                type="password" 
                                placeholder="Leave blank to keep current"
                                className="w-full p-2 border rounded mt-1"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Save Changes
                        </button>
                    </form>

                    {/* Right: Security Settings (2FA) */}
                    <div className="border-l pl-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ShieldCheck className="text-green-600"/> Security
                        </h3>
                        
                        <div className="bg-gray-100 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">Two-Factor Auth</p>
                                    <p className="text-xs text-gray-500">Secure your account with Email OTP.</p>
                                </div>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input 
                                        type="checkbox" 
                                        name="toggle" 
                                        id="toggle" 
                                        checked={is2FA}
                                        onChange={handleToggle2FA}
                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6"
                                    />
                                    <label 
                                        htmlFor="toggle" 
                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${is2FA ? 'bg-green-500' : 'bg-gray-300'}`}
                                    ></label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-500">
                            <p>Status: <span className={is2FA ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                                {is2FA ? 'Enabled' : 'Disabled'}
                            </span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;