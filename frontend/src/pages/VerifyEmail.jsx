import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const navigate = useNavigate();
    const { setCredentials } = useAuthStore();

    const { state } = useLocation();
    const email = state?.email;

    const handleVerify = async (e) => {
        e.preventDefault();
        
        if (!code || code.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post('/api/auth/verify-email', { email, code });
            setCredentials({ ...res.data });
            toast.success('Email Verified!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            await axios.post('/api/auth/resend-code', { email });
            toast.success('Verification code resent!');
        } catch (err) {
            toast.error('Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand Section */}
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
                        <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
                    <p className="text-indigo-100">We've sent a verification code</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-6">
                        <p className="text-gray-600">
                            We sent a 6-digit code to<br />
                            <span className="font-semibold text-gray-900">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-6">
                        {/* Verification Code Input */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                Verification Code
                            </label>
                            <input
                                id="code"
                                type="text"
                                placeholder="000000"
                                className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-center text-3xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 outline-none"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                            />
                            <p className="mt-2 text-xs text-gray-500 text-center">Enter the 6-digit code from your email</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || code.length !== 6}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform transition duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </div>
                            ) : (
                                'Verify Account'
                            )}
                        </button>
                    </form>

                    {/* Resend Code Section */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                        <button
                            onClick={handleResendCode}
                            disabled={isResending}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResending ? 'Resending...' : 'Resend Code'}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                        </div>
                    </div>

                    {/* Back to Login Link */}
                    <div className="mt-6 text-center">
                        <Link 
                            to="/login" 
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold transition duration-200 text-sm"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </div>

                {/* Help Text */}
                <p className="text-center text-sm text-indigo-100 mt-6">
                    Check your spam folder if you don't see the email
                </p>
            </div>
        </div>
    );
};

export default VerifyEmail;