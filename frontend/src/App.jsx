// App.jsx - Main application with routes (Trusted removed)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import CompleteProfile from './pages/CompleteProfile';
import Home from './pages/Home';
import CreateRide from './pages/CreateRide';
import MyRides from './pages/MyRides';
import Profile from './pages/Profile';
import RideChat from './pages/RideChat';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
            },
          }}
        />

        {/* Main App Layout */}
        <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-50">
          {/* Navbar */}
          <Navbar />

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />

              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/create-ride" element={
                <ProtectedRoute>
                  <CreateRide />
                </ProtectedRoute>
              } />
              <Route path="/my-rides" element={
                <ProtectedRoute>
                  <MyRides />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/ride/:rideId/chat" element={
                <ProtectedRoute>
                  <RideChat />
                </ProtectedRoute>
              } />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
