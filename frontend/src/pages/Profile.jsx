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
        <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col items-center pt-10 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
                
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6 font-medium transition-colors">
                    <ArrowLeft size={20} className="mr-2"/> Back to Dashboard
                </button>

                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-gray-900">
                    <User className="text-blue-600" size={32}/> Profile Settings
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Left: Edit Details */}
                    <form onSubmit={handleUpdateProfile}>
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Personal Details</h3>
                        
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full p-3 border-2 border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={fullname} 
                                onChange={(e) => setFullname(e.target.value)}
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                            <input 
                                type="password" 
                                placeholder="Leave blank to keep current"
                                className="w-full p-3 border-2 border-gray-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30 transition-all">
                            Save Changes
                        </button>
                    </form>

                    {/* Right: Security Settings (2FA) */}
                    <div className="border-l-2 border-gray-200 pl-8">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                            <ShieldCheck className="text-green-600" size={24}/> Security
                        </h3>
                        
                        <div className="bg-linear-to-br from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800">Two-Factor Auth</p>
                                    <p className="text-xs text-gray-600 mt-1">Secure your account with Email OTP.</p>
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

                        <div className="mt-4 text-sm">
                            <p className="text-gray-600">Status: <span className={is2FA ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
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