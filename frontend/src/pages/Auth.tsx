import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const BACKEND_URL = 'http://localhost:8000';

const Auth = () => {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId) {
      setMessage('Please enter your Worker ID.');
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append('user_id', userId);

      await axios.post(`${BACKEND_URL}/login`, form);

      localStorage.setItem('userId', userId);
      window.location.href = '/survey';
    } catch (err: any) {
      setMessage(err.response?.data?.detail || 'Unable to start session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Enter Your Worker ID</h2>
        <input
          placeholder="Worker ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Please wait...' : 'Continue'}
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Auth;