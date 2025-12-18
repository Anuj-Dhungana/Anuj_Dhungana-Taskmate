import { useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-hot-toast';

const Register = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/register', { fullname, email, password });
      dispatch(setCredentials({ ...res.data }));
      toast.success('Registration successful!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.error);
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
      </form>
    </div>
  );
};

export default Register;