import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (userInfo) {
      navigate('/dashboard');
    }
  }, [navigate, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      // API Call
      const res = await axios.post('/api/auth/login', { email, password });
      // Save to Redux
      dispatch(setCredentials({ ...res.data }));
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={submitHandler} className="p-8 bg-white shadow-md rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        
        <input 
          type="email" placeholder="Email" 
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        
        <input 
          type="password" placeholder="Password" 
          className="w-full p-2 mb-6 border border-gray-300 rounded"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
        
        <button className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition">
          Login
        </button>

        <div className="mt-4 text-center">
            <span className="text-gray-600">New here? </span>
            <Link to="/register" className="text-indigo-600 hover:underline">Create Account</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;