import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    
    // Load remembered email if available
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user types
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Sign in user with Supabase through our useAuth hook
      const { error } = await signIn(formData.email, formData.password);

      if (error) throw error;

      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors({ 
        general: error.message || 'Invalid email or password. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-8">
            <h2 className="font-display text-2xl font-bold text-center mb-6">
              Welcome Back
            </h2>
            
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-600 text-sm">{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3 rounded-md border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } focus:ring-army-green focus:border-army-green pl-10`}
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full px-4 py-3 rounded-md border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } focus:ring-army-green focus:border-army-green pl-10`}
                    placeholder="Enter your password"
                  />
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-army-green focus:ring-army-green rounded"
                  />
                  <span className="ml-2 block text-sm text-gray-700">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-army-green hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full bg-army-green text-white py-3 rounded-md hover:bg-army-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-5 w-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-army-green font-medium hover:underline">
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
