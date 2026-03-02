import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import logo from '../../assets/logo.png';

/* ── shared brand left panel ── */
const BrandPanel = ({ headline, subtext, features }) => (
    <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-center px-14 py-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)' }}>
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: '#818cf8' }} />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: '#a78bfa' }} />
        <div className="absolute -bottom-20 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
                <img src={logo} alt="TaskMate" className="w-11 h-11 rounded-xl object-contain" />
                <span className="text-white text-xl font-bold tracking-tight">TaskMate</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">{headline}</h1>
            <p className="text-indigo-200 text-base leading-relaxed mb-12">{subtext}</p>
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

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

const REGISTER_FEATURES = [
    'Create unlimited workspaces',
    'Invite team members instantly',
    'Kanban boards & task tracking',
    'Team chat & notifications',
];

const Register = () => {
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('inviteToken');
    const inviteEmail = searchParams.get('email');

    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState(inviteEmail || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { userInfo } = useAuthStore();

    useEffect(() => {
        if (userInfo) navigate('/dashboard');
    }, [navigate, userInfo]);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!fullname || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields'); return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match'); return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters'); return;
        }
        setIsLoading(true);
        try {
            const res = await axios.post('/api/auth/register', { fullname, email, password });
            toast.success(res.data.message);
            navigate('/verify-email', { state: { email, inviteToken: inviteToken || null } });
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex animate-[fadeIn_.4s_ease]">
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── LEFT brand panel ── */}
            <BrandPanel
                headline={"Start Your Free Workspace"}
                subtext={"Create projects, invite members, and collaborate in minutes."}
                features={REGISTER_FEATURES}
            />

            {/* ── RIGHT form panel ── */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 p-8 overflow-y-auto">
                <div className="w-full max-w-md py-8">

                    {/* mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
                        <img src={logo} alt="TaskMate" className="w-9 h-9 rounded-lg object-contain" />
                        <span className="text-gray-900 text-lg font-bold">TaskMate</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                            <p className="text-gray-500 text-sm mt-1">Get started — it&apos;s free forever</p>
                        </div>

                        {inviteToken && (
                            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
                                📧 You are registering through a workspace invitation
                            </div>
                        )}

                        <form onSubmit={submitHandler} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input id="fullname" type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} required
                                        placeholder="Anuj dhungana"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                        placeholder="you@example.com"
                                        readOnly={!!inviteEmail}
                                        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm ${inviteEmail ? 'cursor-not-allowed opacity-70' : ''}`} />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                                        placeholder="Min. 6 characters"
                                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm" />
                                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                                        placeholder="Re-enter password"
                                        className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm" />
                                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button type="submit" disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-md shadow-indigo-200 mt-2">
                                {isLoading ? <><Spinner />Creating account…</> : <>Create Account <ArrowRight size={16} /></>}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-7 flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">OR</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        <p className="text-center text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link to={inviteToken ? `/login?inviteToken=${inviteToken}` : '/login'}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold transition">
                                Login
                            </Link>
                        </p>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">© 2025 TaskMate. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default Register;

