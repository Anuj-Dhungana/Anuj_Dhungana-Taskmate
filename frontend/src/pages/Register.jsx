import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom'; 
import useAuthStore from '../store/useAuthStore';

const Register = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate(); 

  const { userInfo , setCredentials } = useAuthStore();

  
  useEffect(() => {
    if (userInfo) {
      navigate('/dashboard');
    }
  }, [navigate, userInfo]);

const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/register', { fullname, email, password });
      
      toast.success(res.data.message); // "Check your email"
      
      // Don't login yet. Go to verify page, passing the email.
      navigate('/verify-email', { state: { email } }); 
      
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <form onSubmit={submitHandler} className="p-8 bg-white shadow-lg rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Join TaskMate</h2>
        
        <input 
          type="text" placeholder="Full Name" 
          className="w-full p-2 mb-4 border rounded"
          value={fullname} onChange={(e) => setFullname(e.target.value)}
        />
        
        <input 
          type="email" placeholder="Email" 
          className="w-full p-2 mb-4 border rounded"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        
        <input 
          type="password" placeholder="Password" 
          className="w-full p-2 mb-6 border rounded"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Register
        </button>

        <div className="mt-4 text-center">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;