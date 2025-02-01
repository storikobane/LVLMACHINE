import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../styles/login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/'); // Redirect to home if already logged in
      }
    };
    checkSession();
  }, [navigate]);

  // Handle Discord login
  const handleDiscordLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin, // Redirect to the current domain
      },
    });

    if (error) {
      setErrorMessage('Error logging in with Discord: ' + error.message);
      setIsLoading(false);
    }
  };

  // Handle email login or sign-up
  const handleEmailAction = async () => {
    setErrorMessage('');
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage('Please enter an email and password.');
      setIsLoading(false);
      return;
    }

    if (isSignUp) {
      // Sign up user
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setErrorMessage('Error signing up: ' + error.message);
      } else {
        setErrorMessage('Check your email to confirm your account.');
      }
      setIsLoading(false);
    } else {
      // Login user
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage('Login failed: ' + error.message);
        setIsLoading(false);
      } else {
        navigate('/'); // Redirect to home
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
        <form>
          <div className="input-box">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
            />
            <label>Email</label>
          </div>
          <div className="input-box">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
            />
            <label>Password</label>
          </div>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button className="btn" type="button" onClick={handleEmailAction} disabled={isLoading}>
            {isLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        {!isSignUp && (
          <div className="forgot-pass">
            <button className="btn" onClick={handleDiscordLogin} disabled={isLoading}>
              {isLoading ? 'Redirecting...' : 'Sign in with Discord'}
            </button>
          </div>
        )}

        <div className="signup-link">
          <p>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsSignUp(!isSignUp);
                setErrorMessage('');
              }}
            >
              {isSignUp ? 'Login' : 'Sign up'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
