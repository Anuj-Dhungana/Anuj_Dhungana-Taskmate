import { useState } from 'react';
import { User, Lock, Bell, Globe, Palette, Shield } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Settings = () => {
    const { userInfo } = useAuthStore();
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        fullname: userInfo?.fullname || '',
        email: userInfo?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'preferences', label: 'Preferences', icon: Palette },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put('/api/auth/profile', {
                fullname: formData.fullname,
                email: formData.email
            });
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update profile');
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        try {
            await axios.put('/api/auth/profile', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            toast.success('Password updated successfully');
            setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update password');
        }
    };

    return (
        <div className="px-8 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-2">Manage your account settings and preferences</p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar Tabs */}
                <div className="w-64 bg-white rounded-lg border p-2 h-fit">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                                    activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-lg border">
                    {activeTab === 'profile' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="fullname"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                            
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
                                <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter current password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter new password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Confirm new password"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                                        >
                                            Update Password
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Two-Factor Authentication</h3>
                                <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                                    Enable 2FA
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                            <div className="space-y-4 max-w-lg">
                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">Email Notifications</div>
                                        <div className="text-sm text-gray-500">Receive email updates about your projects</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">Push Notifications</div>
                                        <div className="text-sm text-gray-500">Get push notifications for important updates</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <div className="font-medium text-gray-900">Task Assignments</div>
                                        <div className="text-sm text-gray-500">Get notified when tasks are assigned to you</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
                            <div className="space-y-6 max-w-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option>English</option>
                                        <option>Spanish</option>
                                        <option>French</option>
                                        <option>German</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                    <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                        <option>UTC-05:00 (Eastern Time)</option>
                                        <option>UTC-08:00 (Pacific Time)</option>
                                        <option>UTC+00:00 (GMT)</option>
                                        <option>UTC+05:30 (India)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                                    <div className="flex gap-3">
                                        <button className="flex-1 p-4 border-2 border-blue-600 rounded-lg bg-white">
                                            <div className="font-medium text-sm">Light</div>
                                        </button>
                                        <button className="flex-1 p-4 border-2 border-gray-200 rounded-lg bg-gray-900 text-white">
                                            <div className="font-medium text-sm">Dark</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
