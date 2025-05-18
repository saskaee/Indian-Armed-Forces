import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { BarChart2, Award, ChevronRight, BookText, GraduationCap } from 'lucide-react';

// Define interfaces for data types
interface TestResult {
  id: string;
  user_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_taken_seconds: number;
  test_type: string;
  completed_at: string;
  answers: string; // JSON string of answers
  questions: string; // JSON string of questions
  created_at: string;
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
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (user) {
      // Fetch user's test results
      const fetchTestResults = async () => {
        try {
          const { data, error } = await supabase
            .from('test_results')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false });

          if (error) throw error;
          setTestResults(data || []);
        } catch (error) {
          console.error('Error fetching test results:', error);
        }
      };

      // Fetch user avatar from Supabase storage
      const fetchAvatar = async () => {
        try {
          const { data, error } = await supabase
            .storage
            .from('avatars')
            .download(`${user.id}.png`);
            
          if (data && !error) {
            const url = URL.createObjectURL(data);
            setAvatarUrl(url);
          }
        } catch (error) {
          console.error('Error downloading avatar:', error);
        }
        
        // Fetch profile image from user metadata as fallback
        try {
          if (user.user_metadata?.avatar_url) {
            setProfileImageUrl(user.user_metadata.avatar_url);
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
        
        setLoadingData(false);
      };

      fetchTestResults();
      fetchAvatar();
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

  const getTestTypeName = (testType: string) => {
    const testTypeNames: {[key: string]: string} = {
      'army_knowledge': 'Army Knowledge Test',
      'navy_knowledge': 'Navy Knowledge Test',
      'airforce_knowledge': 'Air Force Knowledge Test',
      'general_military': 'General Military Test',
      'mock_interview': 'Mock Interview'
    };
    
    return testTypeNames[testType] || testType;
  };
  
  const formatTimeFromSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  // Render test history tab content
  const renderTestsTab = () => {
    return (
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-4">Test History</h3>
        {testResults.length > 0 ? (
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
                {testResults.map(result => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{getTestTypeName(result.test_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(result.completed_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${result.percentage >= 70 ? 'bg-green-100 text-green-800' : result.percentage >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {result.score}/{result.total_questions} ({result.percentage}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimeFromSeconds(result.time_taken_seconds)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => navigate(`/test-results/${result.id}`)}
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
        {COURSES.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COURSES.map(course => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-40 bg-gray-200">
                  {course.image ? (
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-army-green/20 flex items-center justify-center">
                      <BookText className="text-army-green/50" size={48} />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-lg mb-2">{course.title}</h4>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-army-green h-2 rounded-full" 
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Last accessed: {formatDate(course.lastAccessed)}</p>
                  <button 
                    className="mt-3 text-army-green hover:text-army-dark text-sm flex items-center"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    Continue Learning <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You are not enrolled in any courses yet.</p>
            <button
              onClick={() => navigate('/courses')}
              className="bg-army-green text-white px-4 py-2 rounded-md hover:bg-army-dark transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Render overview tab content
  const renderOverviewTab = () => {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-army-green text-white font-bold text-xl">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{user?.email?.split('@')[0]}</h3>
                <p className="text-gray-500">{user?.email}</p>
                <button 
                  onClick={() => navigate('/profile/edit')}
                  className="text-sm text-army-green hover:underline mt-1"
                >
                  Edit Profile
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Tests Taken</h4>
                  <span className="text-2xl font-bold text-army-green">{testResults.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-army-green h-2 rounded-full" 
                    style={{ width: testResults.length > 0 ? '100%' : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Average Score</h4>
                  <span className="text-2xl font-bold text-blue-600">
                    {testResults.length > 0 
                      ? Math.round(testResults.reduce((acc, curr) => acc + curr.percentage, 0) / testResults.length)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: testResults.length > 0 
                        ? `${Math.round(testResults.reduce((acc, curr) => acc + curr.percentage, 0) / testResults.length)}%` 
                        : '0%' 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Courses Enrolled</h4>
                  <span className="text-2xl font-bold text-purple-600">{COURSES.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {/* Recent activity */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Recent Tests</h3>
            </div>
            <div className="p-4">
              {testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.slice(0, 3).map(result => (
                    <div key={result.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div>
                        <p className="text-sm font-medium">{getTestTypeName(result.test_type)}</p>
                        <p className="text-xs text-gray-500">{formatDate(result.completed_at)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${result.percentage >= 70 ? 'bg-green-100 text-green-800' : result.percentage >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {result.score}/{result.total_questions} ({result.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No test attempts yet</p>
              )}
              {testResults.length > 3 && (
                <button 
                  className="mt-3 text-army-green hover:underline text-sm w-full text-center"
                  onClick={() => setActiveTab('tests')}
                >
                  View All Tests
                </button>
              )}
            </div>
          </div>
          
          {/* Recommended courses */}
          {/* <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Recommended Courses</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {COURSES.slice(0, 3).map(course => (
                  <div key={course.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                    <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-army-green/20 flex items-center justify-center">
                          <BookText className="text-army-green/50" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{course.title}</p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-army-green h-1.5 rounded-full" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                className="mt-3 text-army-green hover:underline text-sm w-full text-center"
                onClick={() => setActiveTab('courses')}
              >
                View All Courses
              </button>
            </div>
          </div> */}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-army-green/10 to-neutral-100 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-6 font-medium text-sm flex items-center ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-army-green text-army-green'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Award className="mr-2 h-5 w-5" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`py-4 px-6 font-medium text-sm flex items-center ${
                    activeTab === 'tests'
                      ? 'border-b-2 border-army-green text-army-green'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BarChart2 className="mr-2 h-5 w-5" />
                  Test History
                </button>
                {/* <button
                  onClick={() => setActiveTab('courses')}
                  className={`py-4 px-6 font-medium text-sm flex items-center ${
                    activeTab === 'courses'
                      ? 'border-b-2 border-army-green text-army-green'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  My Courses
                </button> */}
              </nav>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm">
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
