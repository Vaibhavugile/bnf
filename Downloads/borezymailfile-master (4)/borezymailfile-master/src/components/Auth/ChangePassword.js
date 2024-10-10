// src/components/ChangePassword.js
import React, { useState } from 'react';
import { getAuth, updatePassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { TextField, Button } from '@mui/material';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('User not authenticated.');
      return;
    }

    try {
      await updatePassword(user, newPassword);
      setSuccess('Password updated successfully.');
      navigate('/welcome'); // Redirect to the Welcome page or any other page after password change
    } catch (error) {
      console.error('Error updating password:', error);
      setError('Failed to update password. Please try again.');
    }
  };

  return (
    <div className="change-password">
      <h2>Change Your Password</h2>
      <form onSubmit={handleChangePassword}>
        <TextField
          label="New Password"
          type="password"
          variant="outlined"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          fullWidth
        />
        <br />
        <Button type="submit" variant="contained" fullWidth>
          Change Password
        </Button>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
      </form>
    </div>
  );
};

export default ChangePassword;
