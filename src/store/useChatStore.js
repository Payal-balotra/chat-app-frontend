import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  selectedConversation: null,
  typingUsers: {},
  participants: [],
  users: [],
  conversations: [],
  isUsersLoading: false,
  isJoining: false,

  // --- ACTIONS ---

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/user/all-users");
      const raw = res.data.data;
      const data = Array.isArray(raw) ? raw : raw ? [raw] : [];
      console.log("[DEBUG] users from API:", data?.[0]); // inspect first user fields
      set({ users: data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  updateLastSeen: (userIds) => {
    const now = new Date().toISOString();
    set((state) => ({
      users: state.users.map((u) =>
        userIds.includes(u._id) || userIds.includes(u.id) ? { ...u, lastSeen: now } : u
      ),
    }));
  },

  startConversation: (phoneNumber) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    // Leave current room before joining a new one
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {}, isJoining: true });
    socket.emit("startConversation", { phoneNumber });
  },

  groupConversation: (phoneNumbers, name) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    set({ isJoining: true });
    console.log("[GROUP] Creating group with phones:", phoneNumbers, "Name:", name);
    socket.emit("groupConversation", phoneNumbers, name);
  },

  openGroupConversation: (conversationId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return toast.error("Socket not connected");
    // Clear chat data while it loads
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {}, isJoining: true });
    console.log("[GROUP] Opening existing group:", conversationId);
    socket.emit("openGroupConversation", { conversationId });
  },

  sendMessage: (content, type = "text", attachments = []) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;

    socket.emit("sendMessage", {
      conversationId: selectedConversation,
      type,
      content,
      attachments,
    });
  },

  sendTyping: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("typing", { conversationId: selectedConversation });
  },

  readMessages: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("readMessages", { conversationId: selectedConversation });
  },

  addGroupMember: (phoneNumber) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("addGroupMember", { conversationId: selectedConversation, phoneNumber });
  },

  removeGroupMember: (userId) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("removeGroupMember", { conversationId: selectedConversation, userId });
  },

  changeAdmin: (newAdminId) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    if (!socket || !selectedConversation) return;
    socket.emit("changeAdmin", { conversationId: selectedConversation, newAdminId });
  },

  // --- LISTENERS SETUP ---

  subscribeToEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Request initial list of conversations upon subscription
    // Small delay ensures backend auth middleware has finished
    setTimeout(() => {
      if (socket.connected) {
        console.log("[DEBUG] Emitting getConversations to socket:", socket.id);
        socket.emit("getConversations");
      }
    }, 500);

    // Also fetch on every (re)connect
    socket.on("connect", () => {
      console.log("[DEBUG] Socket reconnected, fetching conversations...");
      socket.emit("getConversations");
    });

    // Listeners for successful creation/subscription
    socket.on("existingConversations", (data) => {
      console.log("[DEBUG] Received existingConversations event. Data:", data);
      const rawConvs = Array.isArray(data) ? data : (data?.conversations || []);
      console.log("[DEBUG] Extracted raw conversations list:", rawConvs.length, "items");

      const processedConversations = rawConvs.map(conv => ({
        ...conv,
        isGroup: conv.isGroup || (conv.participants && conv.participants.length > 2)
      }));
      console.log("[DEBUG] Processed conversations:", processedConversations);
      set({ conversations: processedConversations });
    });

    socket.on("conversationStarted", ({ conversationId, participants, messages = [] }) => {
      console.log("[DEBUG] Joined conversation:", conversationId);
      const { isJoining } = get();
      if (isJoining) {
        set({ selectedConversation: conversationId, messages, participants, isJoining: false });
        toast.success("Joined Conversation");
      }
      socket.emit("getConversations");
    });

    socket.on("groupConversationStarted", ({ conversationId, participants, messages = [] }) => {
      console.log("[DEBUG] Joined group conversation:", conversationId);
      const { isJoining } = get();
      const newConv = { _id: conversationId, participants, isGroup: true };
      
      if (isJoining) {
        set((state) => ({
          selectedConversation: conversationId,
          messages,
          participants,
          isJoining: false,
          conversations: [
            ...state.conversations.filter((c) => c._id !== conversationId),
            newConv,
          ],
        }));
        toast.success("Group Created/Joined");
      } else {
        set((state) => ({
          conversations: [
            ...state.conversations.filter((c) => c._id !== conversationId),
            newConv,
          ],
        }));
      }
      socket.emit("getConversations");
    });

    socket.on("addedToGroup", ({ groupName, conversationId }) => {
      console.log("[DEBUG] Added to group:", groupName, conversationId);
      toast.success(`You were added to group: ${groupName || "New Group"}`);
      // Refresh the list to show the new group in sidebar
      socket.emit("getConversations");
    });

    socket.on("removedFromGroup", ({ groupName, conversationId }) => {
      console.log("[DEBUG] Removed from group:", groupName, conversationId);
      toast.error(`You were removed from group: ${groupName || "Group"}`);

      const { selectedConversation } = get();
      if (selectedConversation === conversationId) {
        set({ selectedConversation: null, messages: [], participants: [], typingUsers: {} });
      }
      // Refresh the list to remove the group from sidebar
      socket.emit("getConversations");
    });

    // Listeners for messaging
    // Local tracker for deduplication
    let lastMsgId = null;

    socket.on("newMessage", (data) => {
      const msg = data.message || data;
      const msgId = msg._id || msg.id;
      
      // Prevent processing the same message twice (happens if backend emits to room & user ID)
      if (lastMsgId === msgId) return;
      lastMsgId = msgId;

      const convId = data.conversationId || msg.conversationId;
      const { authUser } = useAuthStore.getState();
      const { selectedConversation, messages, users, conversations } = get();

      // 1. If we're in the chat, just add it to messages
      if (selectedConversation === convId) {
        set({ messages: [...messages, msg] });
      } 
      // 2. If we're NOT in the chat AND it's not our own message, show a toast
      else if (String(msg.sender) !== String(authUser?._id)) {
        const sender = users.find(u => String(u._id) === String(msg.sender));
        const conv = conversations.find(c => String(c._id) === String(convId));
        
        const senderName = sender?.name || sender?.fullName || sender?.phone || "Someone";
        const prefix = conv?.isGroup ? `[${conv.name}] ${senderName}` : senderName;
        
        toast.success(`${prefix}: ${msg.content.substring(0, 30)}${msg.content.length > 30 ? "..." : ""}`, {
          duration: 4000,
          icon: "💬"
        });
      }

      // Always reload conversations to update snippets/unread counts in sidebar
      socket.emit("getConversations");
    });

    // Interaction Events
    socket.on("typing", ({ conversationId, userId }) => {
      if (!conversationId) return;

      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: {
            ...(state.typingUsers[conversationId] || {}),
            [userId]: true
          }
        }
      }));

      // Automatically remove typing status after 3 seconds of inactivity
      setTimeout(() => {
        set((state) => {
          const roomTyping = { ...(state.typingUsers[conversationId] || {}) };
          delete roomTyping[userId];
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: roomTyping
            }
          };
        });
      }, 3000);
    });

    // Group Management Events
    socket.on("memberAdded", ({ conversationId, userId }) => {
      console.log("[DEBUG] Member added to room:", conversationId, userId);
      const { selectedConversation, participants } = get();
      if (typeof conversationId === 'string' && selectedConversation === conversationId) {
        if (!participants.includes(userId)) {
          set({ participants: [...participants, userId] });
        }
      } else if (typeof conversationId === 'undefined') {
        // Fallback for older backend versions
        set((state) => ({ participants: [...state.participants, userId] }));
      }
      toast.success("Member added to group");
    });

    socket.on("memberRemoved", ({ conversationId, userId }) => {
      console.log("[DEBUG] Member removed from room:", conversationId, userId);
      const { selectedConversation, participants } = get();
      if (typeof conversationId === 'string' && selectedConversation === conversationId) {
        set({ participants: participants.filter(id => String(id) !== String(userId)) });
      } else if (typeof conversationId === 'undefined') {
        // Fallback for older backend versions
        set((state) => ({ participants: state.participants.filter(id => id !== userId) }));
      }
      toast.success("Member removed from group");
    });

    socket.on("adminChanged", () => {
      toast.success("Admin changed");
    });

    // Error handling
    socket.on("error", (err) => {
      console.error("Socket error mapping:", err);
      toast.error(err.message || "Socket Error occurred");
    });
  },

  unsubscribeFromEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("existingConversations");
    socket.off("conversationStarted");
    socket.off("groupConversationStarted");
    socket.off("addedToGroup");
    socket.off("removedFromGroup");
    socket.off("newMessage");
    socket.off("typing");
    socket.off("memberAdded");
    socket.off("memberRemoved");
    socket.off("adminChanged");
    socket.off("error");
  },

  setSelectedConversation: (conversationId) => {
    set({ selectedConversation: conversationId, messages: [] });
  },

  clearChatData: () => {
    set({ selectedConversation: null, messages: [], participants: [], typingUsers: {} });
  }
}));