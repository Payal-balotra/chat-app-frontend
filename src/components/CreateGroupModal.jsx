import { useState } from "react";
import { X, Users, Plus, Check } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { authUser } = useAuthStore();
    const { users, groupConversation } = useChatStore();
    const [selectedUsers, setSelectedUsers] = useState([]);

    const otherUsers = users.filter(
        (u) => String(u._id) !== String(authUser?._id)
    );

    const toggleUser = (user) => {
        setSelectedUsers((prev) => {
            const exists = prev.find((u) => String(u._id) === String(user._id));
            if (exists) return prev.filter((u) => String(u._id) !== String(user._id));
            return [...prev, user];
        });
    };

    const handleCreate = () => {
        if (selectedUsers.length < 2) return;
        const phoneNumbers = selectedUsers.map((u) => u.phone);
        groupConversation(phoneNumbers);
        setSelectedUsers([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-base-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">Create Group</h3>
                    </div>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Selected users chips */}
                {selectedUsers.length > 0 && (
                    <div className="px-5 pt-3 flex flex-wrap gap-1.5">
                        {selectedUsers.map((u) => (
                            <span
                                key={u._id}
                                className="badge badge-primary badge-sm gap-1 cursor-pointer hover:badge-error transition-colors"
                                onClick={() => toggleUser(u)}
                            >
                                {u.fullName || u.name || u.phone}
                                <X className="w-3 h-3" />
                            </span>
                        ))}
                    </div>
                )}

                {/* Users list */}
                <div className="p-3 max-h-72 overflow-y-auto">
                    <div className="text-xs font-semibold text-base-content/50 px-2 py-1 uppercase tracking-wider">
                        Select at least 2 members
                    </div>
                    {otherUsers.map((user) => {
                        const isSelected = selectedUsers.some(
                            (u) => String(u._id) === String(user._id)
                        );
                        return (
                            <button
                                key={user._id}
                                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all ${isSelected
                                        ? "bg-primary/10 border border-primary/30"
                                        : "hover:bg-base-200 border border-transparent"
                                    }`}
                                onClick={() => toggleUser(user)}
                            >
                                <div className="w-9 h-9 rounded-full bg-base-300 flex items-center justify-center flex-shrink-0 text-sm font-bold text-base-content/60">
                                    {String(user.fullName || user.name || user.phone).charAt(0)}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {user.fullName || user.name || user.phone}
                                    </div>
                                </div>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                            ? "bg-primary border-primary text-primary-content"
                                            : "border-base-300"
                                        }`}
                                >
                                    {isSelected && <Check className="w-3 h-3" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-base-300 flex items-center justify-between">
                    <span className="text-xs text-base-content/50">
                        {selectedUsers.length} selected
                    </span>
                    <button
                        className="btn btn-primary btn-sm gap-1"
                        disabled={selectedUsers.length < 2}
                        onClick={handleCreate}
                    >
                        <Plus className="w-4 h-4" />
                        Create Group
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
