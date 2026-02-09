import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Upload, Camera, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';

const Profile = () => {
    const navigate = useNavigate();
    const { userInfo, setUserInfo, logout } = useAuthStore();
    const { resetWorkspaceState } = useWorkspaceStore();
    
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [avatar, setAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (userInfo) {
            setFullname(userInfo.fullname || '');
            setEmail(userInfo.email || '');
            setAvatar(userInfo.avatar || '');
        }
    }, [userInfo]);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size should be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('fullname', fullname);
            formData.append('email', email);
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            }

            const res = await axios.put('/api/auth/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            setUserInfo(res.data);
            setAvatar(res.data.avatar || '');
            setAvatarFile(null);
            setAvatarPreview('');
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update profile');
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        try {
            await axios.post('/api/auth/logout');
            logout();
            resetWorkspaceState();
            navigate('/login');
        } catch (err) {
            toast.error('Logout failed');
        }
    };

    const displayAvatar = avatarPreview || avatar;
    const avatarInitial = fullname?.charAt(0)?.toUpperCase() || 'U';

    return (
        <div className="px-8 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-500 mt-2">Manage your personal information and avatar.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Profile Picture</label>
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                {displayAvatar ? (
                                    <img
                                        src={displayAvatar}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-2 border-gray-200">
                                        {avatarInitial}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-lg"
                                    title="Change avatar"
                                >
                                    <Camera size={16} />
                                </button>
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                                >
                                    <Upload size={16} />
                                    Upload Photo
                                </button>
                                <p className="text-xs text-gray-500 mt-2">
                                    JPG, PNG or GIF. Max size 5MB.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={fullname}
                            onChange={(e) => setFullname(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {/* Logout Section */}
                <div className="mt-10 pt-6 border-t border-gray-200">
                    <h3 className="text-gray-900 font-bold mb-2 text-sm uppercase tracking-wide">Account</h3>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                            <p className="font-semibold text-gray-800 text-sm">Sign Out</p>
                            <p className="text-xs text-gray-600 mt-0.5">Sign out of your account on this device.</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-white border-2 border-gray-300 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
