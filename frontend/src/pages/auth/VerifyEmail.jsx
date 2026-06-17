import { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import { inviteAPI } from '../../api/invites';
import { MailCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import logo from '../../assets/logo.png';

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
);

const VerifyEmail = () => {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const { setCredentials } = useAuthStore();

    const { state } = useLocation();
    const email = state?.email;
    const inviteToken = state?.inviteToken;

    const code = digits.join('');

    const handleDigitChange = (index, value) => {
        const v = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = v;
        setDigits(next);
        if (v && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setDigits(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

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

    const handleVerify = async (e) => {
        e.preventDefault();
        if (code.length !== 6) { toast.error('Please enter all 6 digits'); return; }
        setIsLoading(true);
        try {
            const res = await api.post('/api/auth/verify-email', { email, code });
            setCredentials({ ...res.data });
            toast.success('Email verified!');
            if (inviteToken) await handleInviteAcceptance(inviteToken);
            else navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            await api.post('/api/auth/resend-code', { email });
            toast.success('Verification code resent!');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 animate-[fadeIn_.4s_ease]">
            <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

            <div className="w-full max-w-md">
                {/* logo */}
                <div className="flex items-center gap-2 justify-center mb-8">
                    <img src={logo} alt="TaskMate" className="w-9 h-9 rounded-lg object-contain" />
                    <span className="text-gray-900 text-lg font-bold">TaskMate</span>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                    {/* icon */}
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-5">
                        <MailCheck size={30} className="text-indigo-600" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                    <p className="text-gray-500 text-sm mb-1">We sent a verification code to</p>
                    <p className="text-gray-800 font-semibold text-sm mb-7">{email || 'your email'}</p>

                    {inviteToken && (
                        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-800">
                            📧 After verification you will automatically join the workspace
                        </div>
                    )}

                    <form onSubmit={handleVerify}>
                        {/* 6-digit OTP inputs */}
                        <div className="flex justify-center gap-3 mb-7" onPaste={handlePaste}>
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={(el) => (inputRefs.current[i] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={(e) => handleDigitChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className="w-11 h-14 border-2 border-gray-200 rounded-xl text-center text-xl font-bold text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition bg-gray-50 focus:bg-white"
                                />
                            ))}
                        </div>

                        <button type="submit" disabled={isLoading || code.length !== 6}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-md shadow-indigo-200">
                            {isLoading ? <><Spinner />Verifying…</> : 'Verify Account'}
                        </button>
                    </form>

                    {/* Resend */}
                    <div className="mt-6">
                        <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the code?</p>
                        <button onClick={handleResendCode} disabled={isResending}
                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition disabled:opacity-50">
                            <RefreshCw size={14} className={isResending ? 'animate-spin' : ''} />
                            {isResending ? 'Resending…' : 'Resend Code'}
                        </button>
                    </div>

                    {/* back to login */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition">
                            <ArrowLeft size={14} /> Back to Login
                        </Link>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-6">Check your spam folder if you don&apos;t see the email</p>
            </div>
        </div>
    );
};

export default VerifyEmail;

