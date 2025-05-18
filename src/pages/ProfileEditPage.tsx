import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Upload, Save, X, Loader } from 'lucide-react';

interface ProfileFormData {
  username: string;
  email: string;
  bio: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  bio?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Initialize form data with user information
      setFormData(prev => ({
        ...prev,
        username: user.user_metadata?.username || '',
        email: user.email || '',
        bio: user.user_metadata?.bio || ''
      }));

      // Set profile image if available
      if (user.user_metadata?.avatar_url) {
        setProfileImageUrl(user.user_metadata.avatar_url);
      }
    }
  }, [user]);

  useEffect(() => {
    // Create preview URL for uploaded image
    if (profileImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(profileImage);
    } else {
      setPreviewUrl(null);
    }
  }, [profileImage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
      // Clear any previous errors
      setErrors(prev => ({ ...prev, profileImage: undefined }));
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setPreviewUrl(null);
  };

  const validateForm = () => {
    const newErrors: ValidationErrors = {};

    // Basic validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation - only if trying to change password
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (formData.newPassword && formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setIsSaved(false);
    
    try {
      // Update basic profile information
      const updates = {
        email: user?.email !== formData.email ? formData.email : undefined,
        data: {
          username: formData.username,
          bio: formData.bio
        }
      };

      // Update user profile
      const { error: updateError } = await updateUser(updates);
      if (updateError) throw updateError;

      // Handle password change if needed
      if (formData.newPassword && formData.currentPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });
        
        if (passwordError) throw passwordError;
      }

      // Handle profile image upload if changed
      if (profileImage) {
        try {
          // Use the existing public bucket for user avatars
          // Note: The 'public' bucket is created by default in Supabase projects
          const bucketName = 'public';
          
          // Create a unique path for the user's avatar within the bucket
          const filePath = `avatars/${user?.id}/${Date.now()}-${profileImage.name}`;
          
          // Upload the file
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, profileImage, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw uploadError;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          // Update user profile with avatar URL
          if (urlData) {
            await supabase.auth.updateUser({
              data: { avatar_url: urlData.publicUrl }
            });
          }
        } catch (imageError: any) {
          console.error('Error processing profile image:', imageError);
          throw new Error(`Failed to upload profile image: ${imageError.message}`);
        }
      }

      setIsSaved(true);
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Show success for 2 seconds, then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrors({ 
        general: error.message || 'Error updating profile. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-green"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                <p>{errors.general}</p>
              </div>
            )}

            {isSaved && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                <p>Profile updated successfully! Redirecting...</p>
              </div>
            )}

            {/* Profile image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 text-xl relative">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-army-green/20 flex items-center justify-center">
                      {formData.username.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ml-6 flex flex-col">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="profile-image"
                  />
                  <label
                    htmlFor="profile-image"
                    className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </label>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="mt-2 text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Basic Information</h2>
              
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 rounded-md border ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-army-green focus:border-army-green`}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 rounded-md border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-army-green focus:border-army-green`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-army-green focus:border-army-green"
                  placeholder="Tell us a little about yourself"
                />
              </div>
            </div>

            {/* Change Password */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-200">Change Password</h2>
              
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 rounded-md border ${
                    errors.currentPassword ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-army-green focus:border-army-green`}
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 rounded-md border ${
                    errors.newPassword ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-army-green focus:border-army-green`}
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full px-4 py-3 rounded-md border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-army-green focus:border-army-green`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="mr-3 px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-army-green text-white rounded-md hover:bg-army-dark transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPage;
