import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/useAuthStore';
const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const navigate = useNavigate();
   const { setCredentials } = useAuthStore();

    // Get email passed from Register page
    const { state } = useLocation();
    const email = state?.email;

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/auth/verify-email', { email, code });
            setCredentials({ ...res.data }); // Auto login
            toast.success('Email Verified!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="p-8 bg-white shadow-lg rounded-lg w-96 text-center">
                <h2 className="text-2xl font-bold mb-2">Verify Email</h2>
                <p className="text-gray-600 mb-6">We sent a code to <b>{email}</b></p>
                
                <form onSubmit={handleVerify}>
                    <input 
                        type="text" placeholder="Enter 6-digit Code" 
                        className="w-full p-2 mb-4 border rounded text-center text-xl tracking-widest"
                        value={code} onChange={(e) => setCode(e.target.value)}
                        maxLength={6}
                    />
                    <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                        Verify Account
                    </button>
                </form>
            </div>
        </div>
    );
};

export default VerifyEmail;