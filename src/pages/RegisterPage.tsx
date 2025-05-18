import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  profilePicture?: File;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validatePassword = (password: string) => {
    const strength = {
      hasLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password)
    };
    
    return Object.values(strength).filter(Boolean).length;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        profilePicture: e.target.files![0]
      }));
    }
  };

  const validateForm = (step?: number) => {
    const newErrors: ValidationErrors = {};
    const currentValidationStep = step || currentStep;

    // Step 1 validation
    if (currentValidationStep === 1) {
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
    }

    // Step 2 validation
    if (currentValidationStep === 2) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.acceptTerms) {
        newErrors.acceptTerms = true;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateForm(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(2)) return;

    setIsLoading(true);
    try {
      // Register user with Supabase through our useAuth hook
      const { data, error } = await signUp(formData.email, formData.password, formData.username);

      if (error) throw error;

      // If using email confirmation
      if (data.user && !data.session) {
        // Show verification success state
        setIsSuccess(true);
      } else {
        // Auto-login successful, redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ 
        general: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold mb-2">Registration Successful</h2>
              <p className="text-gray-600 mb-6">
                Please check your email to verify your account. A verification link has been sent.
              </p>
              <Link 
                to="/login" 
                className="block w-full bg-army-green text-white py-3 rounded-md hover:bg-army-dark transition-colors text-center"
              >
                Return to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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
              Create Your Account
            </h2>
            
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-600 text-sm">{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`block w-full px-4 py-3 rounded-md border ${
                          errors.username ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-army-green focus:border-army-green pl-10`}
                        placeholder="Choose a username"
                      />
                      <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Picture (Optional)
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="profile-picture"
                      />
                      <label
                        htmlFor="profile-picture"
                        className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                      >
                        <Upload className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">
                          {formData.profilePicture ? formData.profilePicture.name : 'Upload photo'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full bg-army-green text-white py-3 rounded-md hover:bg-army-dark transition-colors"
                  >
                    Next Step
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-gray-600 text-sm">
                      Already have an account?{' '}
                      <Link to="/login" className="text-army-green font-medium hover:underline">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
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
                        placeholder="Create a password"
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
                    
                    <div className="mt-2">
                      <div className="flex gap-1 h-1 mb-1">
                        {[1, 2, 3, 4, 5].map((segment) => (
                          <div
                            key={segment}
                            className={`flex-1 rounded-full transition-colors ${
                              segment <= validatePassword(formData.password)
                                ? getPasswordStrengthColor(validatePassword(formData.password))
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Password strength: {
                          validatePassword(formData.password) <= 2 ? 'Weak' :
                          validatePassword(formData.password) <= 3 ? 'Medium' :
                          validatePassword(formData.password) <= 4 ? 'Strong' :
                          'Very Strong'
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`block w-full px-4 py-3 rounded-md border ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        } focus:ring-army-green focus:border-army-green pl-10`}
                        placeholder="Confirm your password"
                      />
                      <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="flex items-start pt-2">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      name="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-army-green focus:ring-army-green rounded mt-1"
                    />
                    <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700">
                      I agree to the <a href="#" className="text-army-green hover:underline">Terms of Service</a> and <a href="#" className="text-army-green hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="mt-0 text-sm text-red-600">You must accept the terms and conditions</p>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-army-green text-white py-3 rounded-md hover:bg-army-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
