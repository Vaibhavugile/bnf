import React, { useState, useEffect } from 'react';
import { Button, Checkbox, TextField, IconButton, InputAdornment } from '@mui/material';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useUser } from './UserContext'; // Import the context
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './login.css';
import Logo from '../../assets/logo.png';
import BgAbstract from '../../assets/sd.jpg';
import { fetchRealTimeDate } from '../../utils/fetchRealTimeDate';

const Login = () => {
  const { setUserData } = useUser(); // Access setUserData from the context
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        try {
          const auth = getAuth();
          const user = await auth.verifyIdToken(token);
          if (user) {
            setUserData({ name: user.name, role: user.role, email: user.email });
            navigate(user.role === 'Super Admin' ? '/admin-dashboard' : '/user-dashboard');
          }
        } catch (error) {
          console.error('Token validation error:', error);
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
        }
      }
    };
    checkAuthToken();
  }, [setUserData, navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const auth = getAuth();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const token = await user.getIdToken();

      if (rememberMe) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userEmail', JSON.stringify(email));
      } else {
        sessionStorage.setItem('authToken', token);
        sessionStorage.setItem('userEmail', JSON.stringify(email));
      }

      // Check if the user is a Super Admin
      const superAdminQuery = query(collection(db, 'superadmins'), where('email', '==', email));
      const superAdminSnapshot = await getDocs(superAdminQuery);

      if (!superAdminSnapshot.empty) {
        const superAdminData = superAdminSnapshot.docs[0].data();
        setUserData({ name: superAdminData.name, role: 'Super Admin', email });
        navigate('/leads');
        return;
      }

      // Check if the user is a Branch Manager
      const branchQuery = query(collection(db, 'branches'), where('emailId', '==', email));
      const branchSnapshot = await getDocs(branchQuery);

      if (!branchSnapshot.empty) {
        const branchData = branchSnapshot.docs[0].data();
        const today = await fetchRealTimeDate();

        const branchActiveDate = new Date(branchData.activeDate);
        const branchDeactiveDate = new Date(branchData.deactiveDate);

        if (today < branchActiveDate) {
          setError('Branch plan not active.');
          setLoading(false);
          return;
        }

        if (today > branchDeactiveDate) {
          setError('Branch plan is expired.');
          setLoading(false);
          return;
        }

        if (branchData.firstLogin) {
          navigate('/change-password');
          return;
        }

        setUserData({
          name: branchData.ownerName,
          role: 'Branch Manager',
          email,
          branchCode: branchData.branchCode,
          branchName: branchData.branchName,
          numberOfUsers: branchData.numberOfUsers,
        });
        navigate('/welcome');
        return;
      }

      // Check if the user is a Subuser
      const subuserQuery = query(collection(db, 'subusers'), where('email', '==', email));
      const subuserSnapshot = await getDocs(subuserQuery);

      if (!subuserSnapshot.empty) {
        const subuserData = subuserSnapshot.docs[0].data();
        const today = await fetchRealTimeDate();

        // Check if the subuser is active
        if (!subuserData.isActive) {
          setError('Subuser account is inactive. Contact your branch owner.');
          setLoading(false);
          return;
        }

        const subuserActiveDate = new Date(subuserData.activeDate);
        const subuserDeactiveDate = new Date(subuserData.deactiveDate);

        if (today < subuserActiveDate) {
          setError('Subuser plan not active. Contact your branch owner.');
          setLoading(false);
          return;
        }

        if (today > subuserDeactiveDate) {
          setError('Subuser plan is expired. Contact your branch owner.');
          setLoading(false);
          return;
        }

        // Check the associated branch status
        const branchRef = collection(db, 'branches');
        const branchQuery = query(branchRef, where('branchCode', '==', subuserData.branchCode));
        const branchSnapshot = await getDocs(branchQuery);

        if (!branchSnapshot.empty) {
          const branchData = branchSnapshot.docs[0].data();

          const branchActiveDate = new Date(branchData.activeDate);
          const branchDeactiveDate = new Date(branchData.deactiveDate);

          if (!subuserData.isActive) {
            setError('Subuser account is inactive. Contact your branch owner.');
            setLoading(false);
            return;
          }
          if (today < branchActiveDate) {
            setError('Branch plan not active. Contact your branch owner.');
            setLoading(false);
            return;
          }

          if (today > branchDeactiveDate) {
            setError('Branch plan is expired. Contact your branch owner.');
            setLoading(false);
            return;
          }

          setUserData({
            name: subuserData.name,
            role: 'Subuser',
            email,
            branchCode: subuserData.branchCode,
          });
          navigate('/welcome');
          return;
        } else {
          setError('Associated branch not found. Contact your branch owner.');
          setLoading(false);
          return;
        }
      }

      setError('No user found with the provided credentials.');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img src={BgAbstract} alt="Background" className="background-image" />

      <div className="logo-container">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>

      <div className="welcome-text">
        Welcome <br /> Back!
      </div>

      <div className="form-container">
        <div className="title">Sign In</div>
        <div className="subtitle">Welcome back! Please sign in to your account</div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <TextField
              label="Email ID"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
          </div>
          <div className="form-group">
            <TextField
              label="Password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end" sx={{ background: 'transparent' }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </div>

          <div className="remember-me">
            <Checkbox
              checked={rememberMe}
              onChange={() => setRememberMe((prev) => !prev)}
            />
            <label>Remember Me</label>
          </div>

          <div className="forgot-password">
            Forgot your password
          </div>

          <Button fullWidth variant="contained" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'}
          </Button>

          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
