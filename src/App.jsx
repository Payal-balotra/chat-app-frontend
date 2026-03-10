import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );

  return (
    <div>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/signup" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/verify-otp" element={!authUser ? <VerifyOtpPage /> : <Navigate to="/" />} />
        <Route path="/profile/:id" element={authUser ? <ProfilePage /> : <Navigate to="/signup" />} />
      </Routes>
      <Toaster />
    </div>
  );
};
export default App;
