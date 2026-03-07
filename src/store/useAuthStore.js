import { create } from "zustand";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";

const BASE_URL = "http://localhost:5000";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        set({ authUser: null, isCheckingAuth: false });
        get().disconnectSocket();
        return;
      }

      // Instead of an API call which might 404, just decode the token
      let user = { id: "User", phone: "Logged in" };
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        user = { _id: decoded.id, id: decoded.id, phone: "Logged in" };
      } catch (e) {
        console.error("Token decode failed", e);
      }

      set({ authUser: user });
      get().connectSocket();
    } catch (error) {
      console.log("Check auth error:", error);
      set({ authUser: null });
      localStorage.removeItem("token");
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  register: async (phone) => {
    try {
      const res = await axiosInstance.post("/auth/register", { phone });
      
      const data = res.data.data || {};
      const token = data.token || res.data.token;
      const user = data.user || data.existingUser || { phone };

      if (token) {
        localStorage.setItem("token", token);
        set({ authUser: user });
        get().connectSocket();
        toast.success("Logged in successfully (OTP skipped)");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  },

  verifyOtp: async () => {
    // Left empty since we skip OTP
    return false;
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
    const { socket, authUser } = get();

    if (socket || !authUser) return;
    const token = localStorage.getItem("token");

    if(!token) return;

    const newSocket = io(BASE_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });
    
    newSocket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
