import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import {
    Camera, Trash2, ShieldCheck, ShieldOff,
    User, Lock, BarChart3, Loader2,
    Building2, FolderKanban, CheckSquare,
    Eye, EyeOff, Save, LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useWorkspaceStore from '../store/useWorkspaceStore';

/* ─── tiny helpers ─────────────────────────────────────── */
const InputField = ({ label, id, type = 'text', value, onChange, readOnly, placeholder, rightSlot }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                placeholder={placeholder}
                className={`w-full px-4 py-2.5 text-sm border rounded-lg outline-none transition
                    ${readOnly
                        ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
                        : 'bg-white border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    }
                    ${rightSlot ? 'pr-10' : ''}`}
            />
            {rightSlot && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
            )}
        </div>
    </div>
);

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ icon, title, iconColor = 'text-indigo-600', iconBg = 'bg-indigo-50' }) => {
    const Icon = icon;
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className={`w-9 h-9 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
            </div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
    );
};

const StatItem = ({ icon, label, value, loading, iconBg, iconColor }) => {
    const Icon = icon;
    return (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <div className="text-xs text-gray-500 font-medium">{label}</div>
                <div className="text-xl font-bold text-gray-900">
                    {loading ? <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse" /> : value}
                </div>
            </div>
        </div>
    );
};

/* ─── main component ────────────────────────────────────── */
const Profile = () => {
    const navigate = useNavigate();
    const { userInfo, setUserInfo, logout } = useAuthStore();
    const { resetWorkspaceState } = useWorkspaceStore();
    const fileInputRef = useRef(null);

    /* profile fields */
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [originalFullname, setOriginalFullname] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [avatar, setAvatar] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    /* loading states */
    const [profileLoading, setProfileLoading] = useState(true);
    const [savingInfo, setSavingInfo] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [toggling2FA, setToggling2FA] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [loadingActivity, setLoadingActivity] = useState(true);

    /* password form */
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    /* activity stats */
    const [activity, setActivity] = useState({ workspacesCount: 0, projectsCount: 0, tasksCount: 0 });

    const isDirty = fullname.trim() !== originalFullname.trim();

    /* fetch profile */
    useEffect(() => {
        const load = async () => {
            setProfileLoading(true);
            try {
                const res = await api.get('/api/auth/profile');
                const p = res.data || {};
                setFullname(p.fullname || '');
                setOriginalFullname(p.fullname || '');
                setEmail(p.email || '');
                setAvatar(p.avatar || '');
                setTwoFactorEnabled(!!p.twoFactorEnabled);
                setUserInfo(p);
            } catch {
                if (userInfo) {
                    setFullname(userInfo.fullname || '');
                    setOriginalFullname(userInfo.fullname || '');
                    setEmail(userInfo.email || '');
                    setAvatar(userInfo.avatar || '');
                    setTwoFactorEnabled(!!userInfo.twoFactorEnabled);
                }
            } finally {
                setProfileLoading(false);
            }
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* fetch activity */
    useEffect(() => {
        const loadActivity = async () => {
            setLoadingActivity(true);
            try {
                const res = await api.get('/api/auth/activity-stats');
                setActivity(res.data);
            } catch {
                /* silent */
            } finally {
                setLoadingActivity(false);
            }
        };
        loadActivity();
    }, []);

    /* avatar: pick file → upload immediately */
    const handleAvatarChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.error('Max file size is 5 MB'); return; }
        if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }

        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);

        setUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append('avatar', file);
            const res = await api.put('/api/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAvatar(res.data.avatar || '');
            setAvatarPreview('');
            setUserInfo(res.data);
            toast.success('Photo updated');
        } catch (err) {
            setAvatarPreview('');
            toast.error(err?.response?.data?.message || 'Upload failed');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [setUserInfo]);

    /* remove avatar */
    const handleRemoveAvatar = useCallback(async () => {
        setUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append('removeAvatar', 'true');
            const res = await api.put('/api/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAvatar('');
            setAvatarPreview('');
            setUserInfo(res.data);
            toast.success('Photo removed');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to remove photo');
        } finally {
            setUploadingAvatar(false);
        }
    }, [setUserInfo]);

    /* save personal info (name) */
    const handleSaveInfo = useCallback(async () => {
        if (!fullname.trim()) { toast.error('Full name is required'); return; }
        setSavingInfo(true);
        try {
            const fd = new FormData();
            fd.append('fullname', fullname.trim());
            const res = await api.put('/api/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setOriginalFullname(res.data.fullname || '');
            setUserInfo(res.data);
            toast.success('Profile updated');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Update failed');
        } finally {
            setSavingInfo(false);
        }
    }, [fullname, setUserInfo]);

    /* update password */
    const handleUpdatePassword = useCallback(async (e) => {
        e.preventDefault();
        if (!currentPassword) { toast.error('Enter your current password'); return; }
        if (!newPassword) { toast.error('Enter a new password'); return; }
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        setSavingPassword(true);
        try {
            const fd = new FormData();
            fd.append('currentPassword', currentPassword);
            fd.append('password', newPassword);
            await api.put('/api/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password updated');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Password update failed');
        } finally {
            setSavingPassword(false);
        }
    }, [currentPassword, newPassword, confirmPassword]);

    /* toggle 2FA */
    const handleToggle2FA = useCallback(async () => {
        setToggling2FA(true);
        try {
            const res = await api.put('/api/auth/2fa/toggle');
            const enabled = !!res.data?.twoFactorEnabled;
            setTwoFactorEnabled(enabled);
            setUserInfo({ twoFactorEnabled: enabled });
            toast.success(enabled ? '2FA enabled' : '2FA disabled');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update 2FA');
        } finally {
            setToggling2FA(false);
        }
    }, [setUserInfo]);

    /* logout */
    const handleLogout = async () => {
        try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
        logout();
        resetWorkspaceState();
        navigate('/login');
    };

    const displayAvatar = avatarPreview || avatar;
    const avatarInitial = (fullname || email)?.charAt(0)?.toUpperCase() || 'U';
    const Skeleton = ({ className }) => <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;

    return (
        <div className="min-h-full bg-gray-50 px-8 py-8">

            {/* ── Page header ── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your personal info and security</p>
                </div>
                <button
                    onClick={handleSaveInfo}
                    disabled={!isDirty || savingInfo}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {savingInfo
                        ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                        : <><Save size={15} /> Save Changes</>}
                </button>
            </div>

            {/* ── 70/30 grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

                {/* ══ LEFT COLUMN ══ */}
                <div className="space-y-6">

                    {/* Card 1 – Personal Information */}
                    <Card>
                        <CardHeader icon={User} title="Personal Information" />
                        {profileLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <InputField
                                    label="Full Name" id="fullname"
                                    value={fullname} onChange={(e) => setFullname(e.target.value)}
                                    placeholder="Your full name"
                                />
                                <InputField
                                    label="Email Address" id="email" type="email"
                                    value={email} readOnly placeholder="your@email.com"
                                />
                                <p className="text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
                            </div>
                        )}
                    </Card>

                    {/* Card 2 – Security */}
                    <Card>
                        <CardHeader icon={Lock} title="Security" iconColor="text-amber-600" iconBg="bg-amber-50" />
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <InputField
                                label="Current Password" id="currentPw"
                                type={showCurrentPw ? 'text' : 'password'}
                                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                rightSlot={
                                    <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="text-gray-400 hover:text-gray-600">
                                        {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                }
                            />
                            <InputField
                                label="New Password" id="newPw"
                                type={showNewPw ? 'text' : 'password'}
                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                rightSlot={
                                    <button type="button" onClick={() => setShowNewPw((v) => !v)} className="text-gray-400 hover:text-gray-600">
                                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                }
                            />
                            <InputField
                                label="Confirm New Password" id="confirmPw"
                                type={showConfirmPw ? 'text' : 'password'}
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                rightSlot={
                                    <button type="button" onClick={() => setShowConfirmPw((v) => !v)} className="text-gray-400 hover:text-gray-600">
                                        {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                }
                            />
                            <div className="pt-1">
                                <button
                                    type="submit" disabled={savingPassword}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition disabled:opacity-50"
                                >
                                    {savingPassword
                                        ? <><Loader2 size={15} className="animate-spin" /> Updating…</>
                                        : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* Card 3 – 2FA */}
                    <Card>
                        <CardHeader
                            icon={twoFactorEnabled ? ShieldCheck : ShieldOff}
                            title="Two-Factor Authentication"
                            iconColor={twoFactorEnabled ? 'text-emerald-600' : 'text-gray-500'}
                            iconBg={twoFactorEnabled ? 'bg-emerald-50' : 'bg-gray-100'}
                        />
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {twoFactorEnabled ? '2FA is currently enabled' : '2FA is currently disabled'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {twoFactorEnabled
                                        ? 'A verification code will be required on each login.'
                                        : 'Enable two-factor authentication for extra account security.'}
                                </p>
                            </div>
                            <button
                                type="button" role="switch" aria-checked={twoFactorEnabled}
                                onClick={handleToggle2FA} disabled={toggling2FA}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200
                                    ${twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-60`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200
                                    ${twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </Card>

                    {/* Card 4 – Activity Summary */}
                    <Card>
                        <CardHeader icon={BarChart3} title="Activity Summary" iconColor="text-violet-600" iconBg="bg-violet-50" />
                        <p className="text-xs text-gray-400 -mt-3 mb-4">Stats across your account</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <StatItem icon={Building2} label="Workspaces joined" value={activity.workspacesCount} loading={loadingActivity} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
                            <StatItem icon={FolderKanban} label="Projects participated" value={activity.projectsCount} loading={loadingActivity} iconBg="bg-blue-50" iconColor="text-blue-600" />
                            <StatItem icon={CheckSquare} label="Tasks assigned" value={activity.tasksCount} loading={loadingActivity} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                        </div>
                    </Card>

                    {/* Card 5 – Sign Out */}
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-800">Sign Out</p>
                                <p className="text-xs text-gray-500 mt-0.5">Sign out of your account on this device.</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                            >
                                <LogOut size={15} />
                                Logout
                            </button>
                        </div>
                    </Card>

                </div>

                {/* ══ RIGHT COLUMN ══ */}
                <div className="sticky top-8">
                    <Card>
                        <h2 className="text-base font-semibold text-gray-900 mb-5">Your Profile</h2>

                        <div className="flex flex-col items-center text-center">

                            {/* Avatar */}
                            {profileLoading ? (
                                <Skeleton className="w-28 h-28 rounded-full mb-4" />
                            ) : (
                                <div className="relative mb-4">
                                    <div className="w-28 h-28 rounded-full ring-4 ring-indigo-100 ring-offset-2 overflow-hidden">
                                        {uploadingAvatar ? (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <Loader2 size={28} className="text-indigo-400 animate-spin" />
                                            </div>
                                        ) : displayAvatar ? (
                                            <img src={displayAvatar} alt={fullname} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                                                {avatarInitial}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button" onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition shadow-md disabled:opacity-60"
                                        title="Change photo"
                                    >
                                        <Camera size={14} />
                                    </button>
                                </div>
                            )}

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />

                            {profileLoading ? (
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-5 w-32 mx-auto" />
                                    <Skeleton className="h-4 w-48 mx-auto" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-base font-semibold text-gray-900">{fullname}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{email}</p>

                                    {/* badges */}
                                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full
                                            ${twoFactorEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {twoFactorEnabled ? <ShieldCheck size={11} /> : <ShieldOff size={11} />}
                                            2FA {twoFactorEnabled ? 'On' : 'Off'}
                                        </span>
                                    </div>
                                </>
                            )}

                            {/* photo action buttons */}
                            <div className="flex gap-2 mt-5 w-full">
                                <button
                                    type="button" onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition disabled:opacity-50"
                                >
                                    <Camera size={13} />
                                    {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
                                </button>
                                {(displayAvatar && !uploadingAvatar) && (
                                    <button
                                        type="button" onClick={handleRemoveAvatar}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition"
                                    >
                                        <Trash2 size={13} />
                                        Remove
                                    </button>
                                )}
                            </div>

                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default Profile;
