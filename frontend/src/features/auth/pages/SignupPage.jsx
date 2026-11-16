import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService.js';
import Input from '../../../components/ui/Input.jsx';
import Button from '../../../components/ui/Button.jsx';
import { toast } from 'sonner';

export const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.signup({ name, email, password });
      if (data.success) {
        toast.success('Account created successfully! Please sign in.');
        navigate('/login');
      } else {
        setError(data.message || 'Failed to create account.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Failed to register account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0E14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#131720]/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-glass">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-glow-primary mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Create an Account</h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-medium">Join Chat Karo for real-time messaging & AI copilot</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 text-[#FDA4AF] text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Alex Johnson"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            autoFocus
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="alex@example.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={Lock}
            endIcon={showPassword ? EyeOff : Eye}
            onEndIconClick={() => setShowPassword(!showPassword)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3 font-semibold"
            isLoading={isLoading}
          >
            Create Account <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-[#94A3B8]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#A78BFA] hover:text-[#C4B5FD] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
