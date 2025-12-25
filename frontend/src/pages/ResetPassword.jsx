import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        try {
            await axios.put(`/api/auth/reset-password/${token}`, { password });
            toast.success('Password reset successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Invalid or expired token');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-96">
                <h2 className="text-2xl font-bold mb-4 text-center">New Password</h2>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="password" placeholder="New Password" 
                        className="w-full p-2 mb-4 border rounded"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        required minLength={6}
                    />
                    <input 
                        type="password" placeholder="Confirm New Password" 
                        className="w-full p-2 mb-4 border rounded"
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    
                    <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;