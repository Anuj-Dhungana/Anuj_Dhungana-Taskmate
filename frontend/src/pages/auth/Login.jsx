import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../../store/useAuthStore';
import { toast } from 'react-hot-toast';
import { inviteAPI } from '../../api/invites';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import logo from '../../assets/logo.png';

/* ── shared brand left panel ── */
const BrandPanel = ({ headline, subtext, features }) => (
    <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-center px-14 py-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}>

        {/* floating blur shapes */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#818cf8' }} />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: '#a78bfa' }} />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />

        <div className="relative z-10">
            {/* logo */}
            <div className="flex items-center gap-3 mb-12">
                <img src={logo} alt="TaskMate" className="w-11 h-11 rounded-xl object-contain" />
                <span className="text-white text-xl font-bold tracking-tight">TaskMate</span>
            </div>

            {/* headline */}
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">{headline}</h1>
            <p className="text-indigo-200 text-base leading-relaxed mb-12">{subtext}</p>

            {/* feature list */}
            <ul className="space-y-4">
                {features.map((f) => (
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

const LOGIN_FEATURES = [
    'Manage projects & tasks in one place',
    'Real-time team collaboration',
    'Secure workspaces with role controls',
    'Analytics & progress tracking',
];

const Login = () => {
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('inviteToken');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [show2FA, setShow2FA] = useState(false);
    const [otp, setOtp] = useState('');

    const navigate = useNavigate();
    const { userInfo, setCredentials } = useAuthStore();

    useEffect(() => {
        if (userInfo) navigate('/dashboard');
    }, [navigate, userInfo]);

    const handleInviteAcceptance = async (token) => {
        try {
            const res = await inviteAPI.acceptInviteByToken(token);
            toast.success('Successfully joined workspace!');
            navigate(`/workspaces/${res.data.workspace._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept invite');
            navigate('/dashboard');
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post('/api/auth/login', { email, password });
            if (res.data.status === '2fa_required') {
                setShow2FA(true);
                toast.success('2FA Code sent to your email!');
                return;
            }
            setCredentials(res.data);
            if (inviteToken) await handleInviteAcceptance(inviteToken);
            else navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handle2FASubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post('/api/auth/login-2fa', { email, code: otp });
            setCredentials(res.data);
            toast.success('Login Successful!');
            if (inviteToken) await handleInviteAcceptance(inviteToken);
            else navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Invalid Code');
        } finally {
            setIsLoading(false);
        }
    };

    /* ── 2FA screen ── */
    if (show2FA) {
        return (
            <div className="min-h-screen flex">
                <BrandPanel
                    headline={"Welcome Back to TaskMate"}
                    subtext={"Manage your projects. Collaborate with your team. All in one workspace."}
                    features={LOGIN_FEATURES}
                />
                <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock size={24} className="text-indigo-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Two-Factor Auth</h2>
                                <p className="text-gray-500 text-sm mt-2">Enter the code sent to <span className="font-semibold text-gray-800">{email}</span></p>
                            </div>
                            <form onSubmit={handle2FASubmit} className="space-y-5">
                                <input
                                    type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6} autoFocus
                                    className="w-full px-4 py-4 border border-gray-200 rounded-xl text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                    placeholder="000000"
                                />
                                <button disabled={isLoading || otp.length !== 6}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed">
                                    {isLoading ? <><Spinner />Verifying…</> : 'Verify Code'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex animate-[fadeIn_.4s_ease]">
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── LEFT brand panel ── */}
            <BrandPanel
                headline={"Welcome Back to TaskMate"}
                subtext={"Manage your projects. Collaborate with your team. All in one workspace."}
                features={LOGIN_FEATURES}
            />

            {/* ── RIGHT form panel ── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
                <div className="w-full max-w-md">

                    {/* mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
                        <img src={logo} alt="TaskMate" className="w-9 h-9 rounded-lg object-contain" />
                        <span className="text-gray-900 text-lg font-bold">TaskMate</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
                            <p className="text-gray-500 text-sm mt-1">Enter your credentials to continue</p>
                        </div>

                        {inviteToken && (
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
                                📧 Login to accept your workspace invitation
                            </div>
                        )}

                        <form onSubmit={submitHandler} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                        placeholder="you@example.com"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                                        placeholder="Enter your password"
                                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm" />
                                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                    Remember me
                                </label>
                                <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-md shadow-indigo-200 mt-2">
                                {isLoading ? <><Spinner />Signing in…</> : <>Sign In <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-7 flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Register link */}
                        <p className="text-center text-sm text-gray-500">
                            Don&apos;t have an account?{' '}
                            <Link to={inviteToken ? `/register?inviteToken=${inviteToken}` : '/register'}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold transition">
                                Sign Up
                            </Link>
                        </p>

                        {/* Back to home */}
                        <div className="mt-4 flex items-center justify-center">
                            <Link to="/"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition">
                                <ArrowLeft size={14} /> Back to Home
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">© 2025 TaskMate. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;

