import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, KeyRound, ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

/* ── brand left panel ── */
const BrandPanel = () => (
    <div
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-center px-14 py-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}
    >
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#818cf8' }} />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: '#a78bfa' }} />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
                <img src={logo} alt="TaskMate" className="w-11 h-11 rounded-xl object-contain" />
                <span className="text-white text-xl font-bold tracking-tight">TaskMate</span>
            </div>

            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
                Create a New Password
            </h1>
            <p className="text-indigo-200 text-base leading-relaxed mb-12">
                Choose a strong password to keep your TaskMate account safe and secure.
            </p>

            <ul className="space-y-4">
                {[
                    'At least 6 characters long',
                    'Use a mix of letters and numbers',
                    'Never reuse old passwords',
                    'Back to your workspace in seconds',
                ].map((f) => (
                    <li key={f} className="flex items-center gap-3 text-indigo-100 text-sm">
                        <CheckCircle2 size={18} className="text-indigo-400 shrink-0" />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

/* ── spinner ── */
const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

/* ── password strength indicator ── */
const strengthLevel = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-400' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-400' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-400' };
    return { level: 4, label: 'Strong', color: 'bg-green-500' };
};

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [done, setDone] = useState(false);

    const { token } = useParams();
    const navigate = useNavigate();

    const strength = strengthLevel(password);
    const passwordsMatch = confirmPassword && password === confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password || !confirmPassword) { toast.error('Please fill in all fields'); return; }
        if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

        setIsLoading(true);
        try {
            await axios.put(`/api/auth/reset-password/${token}`, { password });
            toast.success('Password reset successful!');
            setDone(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Invalid or expired token');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 animate-[fadeIn_.4s_ease]">
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <BrandPanel />

            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

                {/* mobile logo */}
                <div className="flex items-center gap-2 mb-8 lg:hidden">
                    <img src={logo} alt="TaskMate" className="w-9 h-9 rounded-lg object-contain" />
                    <span className="text-gray-900 text-lg font-bold">TaskMate</span>
                </div>

                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">

                        {!done ? (
                            <>
                                {/* header */}
                                <div className="mb-8">
                                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
                                        <KeyRound size={26} className="text-indigo-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
                                    <p className="text-sm text-gray-500">Enter and confirm your new password below.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* new password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter new password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition text-sm"
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>

                                        {/* strength bar */}
                                        {password && (
                                            <div className="mt-2">
                                                <div className="flex gap-1 mb-1">
                                                    {[1, 2, 3, 4].map((s) => (
                                                        <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= strength.level ? strength.color : 'bg-gray-200'}`} />
                                                    ))}
                                                </div>
                                                <p className={`text-xs font-medium ${strength.level <= 1 ? 'text-red-500' : strength.level === 2 ? 'text-amber-500' : strength.level === 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {strength.label}
                                                </p>
                                            </div>
                                        )}
                                        {!password && <p className="mt-1 text-xs text-gray-400">Must be at least 6 characters</p>}
                                    </div>

                                    {/* confirm password */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className={`w-full pl-10 pr-11 py-3 border rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent focus:bg-white transition text-sm ${
                                                    confirmPassword
                                                        ? passwordsMatch
                                                            ? 'border-green-400 focus:ring-green-400'
                                                            : 'border-red-300 focus:ring-red-400'
                                                        : 'border-gray-200 focus:ring-indigo-500'
                                                }`}
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {confirmPassword && !passwordsMatch && (
                                            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                                        )}
                                        {confirmPassword && passwordsMatch && (
                                            <p className="mt-1 text-xs text-green-600 flex items-center gap-1"><CheckCircle2 size={11} /> Passwords match</p>
                                        )}
                                    </div>

                                    {/* submit */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                                    >
                                        {isLoading ? <><Spinner />Resetting&hellip;</> : <><ShieldCheck size={16} />Reset Password</>}
                                    </button>
                                </form>
                            </>
                        ) : (
                            /* ── success state ── */
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <ShieldCheck size={30} className="text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h3>
                                <p className="text-gray-500 text-sm">Your password has been updated successfully.</p>
                                <p className="text-gray-400 text-xs mt-2">Redirecting to login&hellip;</p>
                            </div>
                        )}

                        {/* back to login */}
                        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center">
                            <Link to="/login"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition">
                                <ArrowLeft size={14} /> Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
