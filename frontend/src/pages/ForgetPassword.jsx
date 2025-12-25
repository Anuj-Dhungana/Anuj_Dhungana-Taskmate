import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/forgot-password', { email });
            toast.success(res.data.message);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-96">
                <h2 className="text-2xl font-bold mb-4 text-center">Reset Password</h2>
                <p className="text-sm text-gray-600 mb-6 text-center">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="email" placeholder="Enter your email" 
                        className="w-full p-2 mb-4 border rounded"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    
                    <button disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link to="/login" className="text-sm text-gray-500 hover:underline">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;