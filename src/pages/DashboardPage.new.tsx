import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// Define interfaces for data types
interface UserAttempt {
  id: string;
  user_id: string;
  category_id: string;
  score: number | null;
  created_at: string;
  time_taken: string | null;
}

interface QuizCategory {
  id: string;
  name: string;
  description: string | null;
}

// Mock data for courses
const COURSES = [
  {
    id: 'course-1',
    title: 'Indian Army Officer Entry',
    progress: 65,
    lastAccessed: '2025-05-15T14:30:00Z',
    image: '/courses/army-officer.jpg',
  },
  {
    id: 'course-2',
    title: 'NDA Preparation',
    progress: 42,
    lastAccessed: '2025-05-12T10:15:00Z',
    image: '/courses/nda-prep.jpg',
  },
  {
    id: 'course-3',
    title: 'Air Force Entry Requirements',
    progress: 28,
    lastAccessed: '2025-05-10T16:20:00Z',
    image: '/courses/air-force.jpg',
  }
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [userAttempts, setUserAttempts] = useState<UserAttempt[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Fetch user's test attempts
      const fetchUserAttempts = async () => {
        try {
          const { data, error } = await supabase
            .from('user_attempts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setUserAttempts(data || []);
        } catch (error) {
          console.error('Error fetching user attempts:', error);
        }
      };

      // Fetch quiz categories
      const fetchCategories = async () => {
        try {
          const { data, error } = await supabase
            .from('quiz_categories')
            .select('*');

          if (error) throw error;
          setCategories(data || []);
        } catch (error) {
          console.error('Error fetching categories:', error);
        }
      };

      // Fetch user profile image if available
      const fetchProfileImage = async () => {
        try {
          if (user.user_metadata?.avatar_url) {
            setProfileImageUrl(user.user_metadata.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
        
        setLoadingData(false);
      };

      fetchUserAttempts();
      fetchCategories();
      fetchProfileImage();
    }
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-army-green"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };
  
  // Render test history tab content
  const renderTestsTab = () => {
    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">Test History</h3>
        {userAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Taken</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userAttempts.map(attempt => (
                  <tr key={attempt.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getCategoryName(attempt.category_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(attempt.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {attempt.score ? `${attempt.score}%` : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {attempt.time_taken || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/test-results/${attempt.id}`)}
                        className="text-army-green hover:text-army-dark"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You haven't taken any tests yet.</p>
            <button
              onClick={() => navigate('/mock-test')}
              className="bg-army-green text-white px-4 py-2 rounded-md hover:bg-army-dark transition-colors"
            >
              Take Your First Test
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Render courses tab content
  const renderCoursesTab = () => {
    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">My Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSES.map(course => (
            <div key={course.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 relative">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-army-green/20"></div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3">
                  <h4 className="font-medium">{course.title}</h4>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress: {course.progress}%</span>
                  <span className="text-xs text-gray-500">Last accessed: {formatDate(course.lastAccessed)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-army-green h-2 rounded-full" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="mt-4 w-full bg-army-green text-white py-2 rounded-md hover:bg-army-dark transition-colors"
                >
                  Continue Course
                </button>
              </div>
            </div>
          ))}
          
          {/* Add new course card */}
          <div className="bg-white rounded-lg border border-dashed border-gray-300 hover:border-army-green flex flex-col items-center justify-center p-8 hover:shadow-md transition-all cursor-pointer"
               onClick={() => navigate('/courses/browse')}>
            <div className="w-16 h-16 rounded-full bg-army-green/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-army-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h4 className="font-medium text-army-green">Explore More Courses</h4>
            <p className="text-sm text-gray-500 text-center mt-2">Discover new learning opportunities</p>
          </div>
        </div>
      </div>
    );
  };
  
  // Render overview tab content
  const renderOverviewTab = () => {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent activity */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {userAttempts.length > 0 ? (
              <div className="space-y-3">
                {userAttempts.slice(0, 3).map(attempt => (
                  <div key={attempt.id} className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{getCategoryName(attempt.category_id)}</p>
                        <p className="text-sm text-gray-500">{formatDate(attempt.created_at)}</p>
                      </div>
                      <span className="bg-army-green/10 text-army-green text-sm px-2 py-1 rounded">
                        Score: {attempt.score || 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No test attempts yet. Take a test to see your results here.</p>
            )}
            {userAttempts.length > 3 && (
              <button 
                className="mt-3 text-army-green hover:underline text-sm w-full text-center"
                onClick={() => setActiveTab('tests')}
              >
                View all tests
              </button>
            )}
          </div>
          
          {/* Course progress */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Course Progress</h3>
            {COURSES.length > 0 ? (
              <div className="space-y-3">
                {COURSES.slice(0, 3).map(course => (
                  <div key={course.id} className="bg-white p-3 rounded-md shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden">
                        {course.image ? (
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-army-green/20"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{course.title}</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-army-green h-2 rounded-full" 
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Last accessed: {formatDate(course.lastAccessed)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No courses enrolled yet. Explore our courses to start learning.</p>
            )}
            {COURSES.length > 3 && (
              <button 
                className="mt-3 text-army-green hover:underline text-sm w-full text-center"
                onClick={() => setActiveTab('courses')}
              >
                View all courses
              </button>
            )}
          </div>
        </div>
        
        {/* Recommended tests and resources */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Recommended For You</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/mock-test')}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <h4 className="font-medium">Take a Mock Test</h4>
              <p className="text-sm text-gray-500 mt-1">Practice with realistic test questions</p>
            </button>
            <button
              onClick={() => navigate('/mock-interview')}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <h4 className="font-medium">Try a Mock Interview</h4>
              <p className="text-sm text-gray-500 mt-1">Practice your interview skills</p>
            </button>
            <button
              onClick={() => navigate('/resources')}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
            >
              <h4 className="font-medium">Explore Resources</h4>
              <p className="text-sm text-gray-500 mt-1">Access study materials and guides</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with profile overview */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-army-green/20 flex items-center justify-center">
                  {user?.user_metadata?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {user?.user_metadata?.username || 'User'}
              </h1>
              <p className="text-gray-600">{user?.email}</p>
              
              <div className="mt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                  <span className="font-medium">Tests Taken:</span> {userAttempts.length}
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                  <span className="font-medium">Courses:</span> {COURSES.length}
                </div>
                <div className="bg-gray-100 px-4 py-2 rounded-full text-sm">
                  <span className="font-medium">Joined:</span> {user?.created_at ? formatDate(user.created_at) : 'N/A'}
                </div>
              </div>
            </div>
            
            <button 
              className="bg-army-green text-white px-4 py-2 rounded-md hover:bg-army-dark transition-colors"
              onClick={() => navigate('/profile/edit')}
            >
              Edit Profile
            </button>
          </div>
          
          {/* Dashboard tabs */}
          <div className="w-full bg-white rounded-lg shadow-md">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-3 font-medium ${activeTab === 'overview' ? 'text-army-green border-b-2 border-army-green' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('tests')}
                className={`px-4 py-3 font-medium ${activeTab === 'tests' ? 'text-army-green border-b-2 border-army-green' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tests History
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-4 py-3 font-medium ${activeTab === 'courses' ? 'text-army-green border-b-2 border-army-green' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Courses
              </button>
            </div>
            
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'tests' && renderTestsTab()}
            {activeTab === 'courses' && renderCoursesTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
