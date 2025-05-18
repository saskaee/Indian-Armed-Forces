// App component with React Router and Auth Provider
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArmyCategoriesPage from './pages/ArmyCategoriesPage';
import HowToApplyPage from './pages/HowToApplyPage';
import LearningResourcesPage from './pages/LearningResourcesPage';
import ContactPage from './pages/ContactPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfileEditPage from './pages/ProfileEditPage';
import MockTestPage from './pages/MockTestPage';
import MockInterviewPage from './pages/MockInterviewPage';
import TestResultsPage from './pages/TestResultsPage';
import ProgressPage from './pages/ProgressPage';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop'; 
function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public routes */}
          <Route index element={<HomePage />} />
          <Route path="categories" element={<ArmyCategoriesPage />} />
          <Route path="how-to-apply/:branch" element={<HowToApplyPage />} />
          <Route path="resources" element={<LearningResourcesPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          
          {/* Protected routes - require authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile/edit" element={<ProfileEditPage />} />
            <Route path="mock-test" element={<MockTestPage />} />
            <Route path="mock-interview" element={<MockInterviewPage />} />
            <Route path="test-results" element={<TestResultsPage />} />
            <Route path="test-results/:id" element={<TestResultsPage />} />
            <Route path="progress" element={<ProgressPage />} />
          </Route>
          
          {/* Catch all route for 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;