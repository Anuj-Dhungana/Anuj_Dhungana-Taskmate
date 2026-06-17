import { useState } from 'react';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Send, MailCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

/* ── shared brand left panel ── */
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
                Reset Your Password
            </h1>
            <p className="text-indigo-200 text-base leading-relaxed mb-12">
                Forgot your password? No worries — just enter your email and we&apos;ll send you a secure reset link.
            </p>

            <ul className="space-y-4">
                {[
                    'Secure password reset via email',
                    'Link expires after 1 hour for safety',
                    'No sharing credentials required',
                    'Back to your workspace in minutes',
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

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { toast.error('Please enter your email address'); return; }
        setLoading(true);
        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            toast.success(res.data.message);
            setEmailSent(true);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
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

                        {!emailSent ? (
                            <>
                                <div className="mb-8">
                                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-5">
                                        <Mail size={26} className="text-indigo-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h2>
                                    <p className="text-sm text-gray-500">
                                        Enter your email and we&apos;ll send you a reset link.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            <input
                                                type="email"
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                                    >
                                        {loading ? <><Spinner />Sending&hellip;</> : <><Send size={15} />Send Reset Link</>}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-2">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                    <MailCheck size={30} className="text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h3>
                                <p className="text-gray-500 text-sm mb-1">We sent a reset link to</p>
                                <p className="text-gray-800 font-semibold text-sm mb-6">{email}</p>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 text-left">
                                    <p className="text-sm text-amber-800">
                                        <span className="font-semibold">Didn&apos;t receive it?</span> Check your spam folder or{' '}
                                        <button
                                            onClick={() => setEmailSent(false)}
                                            className="text-indigo-600 hover:text-indigo-700 font-semibold underline"
                                        >
                                            try a different email
                                        </button>
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
                            >
                                <ArrowLeft size={14} /> Back to Login
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        Check your spam folder if you don&apos;t see the email
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
