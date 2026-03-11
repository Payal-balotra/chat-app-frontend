import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "./useChatStore";

const BASE_URL = "https://chat-app-zadj.onrender.com";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: () => {
    const token = localStorage.getItem("token");

    if (!token) {
      set({ authUser: null, isCheckingAuth: false });
      get().disconnectSocket();
      return;
    }

    // Decode the token to get minimal user info (just for routing)
    // Socket "me" event will update with full user data from DB
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(window.atob(base64));
      const phone = localStorage.getItem("userPhone") || "";
      set({ authUser: { _id: decoded.userId || decoded.id, phone }, isCheckingAuth: false });
    } catch (e) {
      console.error("Token decode failed:", e);
      localStorage.removeItem("token");
      set({ authUser: null, isCheckingAuth: false });
      return;
    }

    // Connect socket for real-time features + full user data via "me" event
    get().connectSocket();
  },

  register: async (phone) => {
    try {
      const res = await axiosInstance.post("/auth/register", { phone });
      const data = res.data.data || res.data;

      // If user is already verified, backend might return a token immediately
      if (data && data.token) {
        const { existingUser, token } = data;
        const user = existingUser || data.user;
        
        localStorage.setItem("token", token);
        localStorage.setItem("userPhone", phone);
        
        const processedUser = {
          ...user,
          _id: user._id || user.id,
          id: user.id || user._id
        };
        
        set({ authUser: processedUser });
        get().connectSocket();
        toast.success("Already verified! Logged in successfully");
        return { success: true, alreadyLogged: true };
      }

      toast.success(res.data.message || "OTP sent successfully");
      return { success: true, alreadyLogged: false };
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return { success: false };
    }
  },

  verifyOtp: async ({ phone, otp }) => {
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { phone, otp });

      const { user, token } = res.data.data || res.data;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("userPhone", phone);
        const processedUser = {
          ...user,
          _id: user._id || user.id,
          id: user.id || user._id
        };
        set({ authUser: processedUser });
        get().connectSocket();
        toast.success("Logged in successfully");
        return { success: true, user: processedUser };
      }
      return { success: false };
    } catch (error) {
      toast.error(error.response?.data?.message || "OTP verification failed");
      return { success: false };
    }
  },

  createProfile: async (id, profileData) => {
    try {
      const res = await axiosInstance.post(`/user/profile/${id}`, profileData);
      const rawUser = res.data.data || res.data;
      const updatedUser = {
        ...rawUser,
        _id: rawUser._id || rawUser.id,
        id: rawUser.id || rawUser._id
      };
      set({ authUser: updatedUser });
      toast.success("Profile created successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create profile");
      return false;
    }
  },

  updateProfile: async (id, data) => {
    if (!id) {
      console.error("[AUTH] Cannot update profile: ID is undefined");
      return false;
    }
    try {
      const res = await axiosInstance.put(`/user/profile/${id}`, data);
      const rawUser = res.data.data || res.data;
      const updatedUser = {
        ...rawUser,
        _id: rawUser._id || rawUser.id,
        id: rawUser.id || rawUser._id
      };
      set({ authUser: updatedUser });
      toast.success("Profile updated successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
      return false;
    }
  },

  logout: () => {
    try {
      localStorage.removeItem("token");
      set({ authUser: null, onlineUsers: [] });
      get().disconnectSocket();
      toast.success("Logged out successfully");
    } catch (error) {
      console.log(error);
      toast.error("Logout failed");
    }
  },

  connectSocket: () => {
    const { socket } = get();
    if (socket) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const newSocket = io(BASE_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    // Backend middleware authenticates and emits user data
    newSocket.on("me", (userData) => {
      console.log("[AUTH] Received full user data from socket 'me':", userData);
      if (userData) {
        // Ensure ID is accessible via both ._id and .id for consistency
        const processedUser = {
          ...userData,
          _id: userData._id || userData.id,
          id: userData.id || userData._id
        };
        set({ authUser: processedUser, isCheckingAuth: false });
      } else {
        console.warn("[AUTH] Received null user data from socket 'me' event");
      }
    });

    // Fallback: if "me" never fires within 5s, stop showing loading
    setTimeout(() => {
      const { authUser } = get();
      if (!authUser) {
        console.warn("[AUTH] Socket 'me' event not received within 5s");
        set({ isCheckingAuth: false });
      }
    }, 5000);

    newSocket.on("getOnlineUsers", (userIds) => {
      set((state) => {
        // Find users who were online but just went offline
        const wentOffline = state.onlineUsers.filter((id) => !userIds.includes(id));
        if (wentOffline.length > 0) {
          useChatStore.getState().updateLastSeen(wentOffline);
        }
        return { onlineUsers: userIds };
      });
    });

    // If token is invalid, the socket connection will fail
    newSocket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      // Only clear token if it's an auth error, not a transient network issue
      if (err.message?.includes("401") || err.message?.includes("Access denied") ||
        err.message?.includes("Invalid token") || err.message?.includes("user not found")) {
        localStorage.removeItem("token");
        set({ authUser: null, isCheckingAuth: false });
        newSocket.disconnect();
      }
    });

    // Explicitly disconnect when the user closes/refreshes the tab
    const handleBeforeUnload = () => {
      newSocket.disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    set({ socket: newSocket, _beforeUnloadHandler: handleBeforeUnload });
  },

  disconnectSocket: () => {
    const { socket, _beforeUnloadHandler } = get();
    if (_beforeUnloadHandler) {
      window.removeEventListener("beforeunload", _beforeUnloadHandler);
    }
    if (socket) {
      socket.disconnect();
      set({ socket: null, _beforeUnloadHandler: null });
    }
  },
}));
