import { useState } from "react";
import {
    X,
    UserPlus,
    UserMinus,
    ShieldCheck,
    Users,
    Phone,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const GroupInfoPanel = ({ isOpen, onClose }) => {
    const { authUser } = useAuthStore();
    const { users, participants, addGroupMember, removeGroupMember, changeAdmin } =
        useChatStore();
    const [addPhone, setAddPhone] = useState("");
    const [expanded, setExpanded] = useState(true);

    if (!isOpen) return null;

    // Resolve participant IDs to user objects
    const memberUsers = participants
        .map((id) => users.find((u) => String(u._id) === String(id)))
        .filter(Boolean);

    const handleAddMember = (e) => {
        e.preventDefault();
        if (!addPhone.trim()) return;
        addGroupMember(addPhone.trim());
        setAddPhone("");
    };

    const handleRemove = (userId) => {
        if (window.confirm("Remove this member from the group?")) {
            removeGroupMember(userId);
        }
    };

    const handleChangeAdmin = (userId) => {
        if (window.confirm("Make this user the group admin?")) {
            changeAdmin(userId);
        }
    };

    return (
        <div className="w-72 card bg-base-100 shadow-sm flex flex-col overflow-hidden flex-shrink-0 border-l border-base-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-base-300 flex items-center justify-between bg-base-200/60">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">Group Info</span>
                </div>
                <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Stats */}
            <div className="p-4 border-b border-base-300">
                <div className="text-xs text-base-content/50 uppercase tracking-wider font-semibold mb-1">
                    Members
                </div>
                <div className="text-2xl font-bold text-primary">
                    {participants.length}
                </div>
            </div>

            {/* Add Member */}
            <form
                onSubmit={handleAddMember}
                className="p-3 border-b border-base-300 flex gap-2"
            >
                <select
                    className="select select-bordered select-sm flex-1 truncate"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                >
                    <option value="" disabled>Select user...</option>
                    {users
                        .filter((u) => !participants.includes(u._id) && !participants.includes(String(u._id)))
                        .map((u) => (
                            <option key={u._id} value={u.phone}>
                                {u.fullName || u.name || u.phone}
                            </option>
                        ))}
                </select>
                <button
                    type="submit"
                    className="btn btn-primary btn-sm btn-square flex-shrink-0"
                    disabled={!addPhone}
                    title="Add member"
                >
                    <UserPlus className="w-4 h-4" />
                </button>
            </form>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto">
                <button
                    className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-base-content/50 uppercase tracking-wider hover:bg-base-200/50"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span>Members ({memberUsers.length})</span>
                    {expanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                    )}
                </button>

                {expanded && (
                    <ul className="px-2 pb-2">
                        {memberUsers.map((member) => {
                            const isMe =
                                String(member._id) === String(authUser?._id);
                            return (
                                <li
                                    key={member._id}
                                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-base-200/50 group"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center flex-shrink-0 text-xs font-bold text-base-content/60">
                                        {String(
                                            member.fullName || member.name || member.phone
                                        ).charAt(0)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">
                                            {isMe
                                                ? "You"
                                                : member.fullName || member.name || member.phone}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs opacity-40">
                                            <Phone className="w-2.5 h-2.5" />
                                            {member.phone}
                                        </div>
                                    </div>

                                    {/* Actions (only for other members) */}
                                    {!isMe && (
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="btn btn-ghost btn-xs btn-circle text-warning"
                                                title="Make Admin"
                                                onClick={() => handleChangeAdmin(member._id)}
                                            >
                                                <ShieldCheck className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-xs btn-circle text-error"
                                                title="Remove"
                                                onClick={() => handleRemove(member._id)}
                                            >
                                                <UserMinus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}

                        {/* Show unresolved participant IDs */}
                        {participants
                            .filter(
                                (id) =>
                                    !users.some((u) => String(u._id) === String(id))
                            )
                            .map((id) => (
                                <li
                                    key={id}
                                    className="flex items-center gap-2 px-2 py-2 rounded-lg opacity-50"
                                >
                                    <div className="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center flex-shrink-0 text-xs">
                                        ?
                                    </div>
                                    <div className="text-xs font-mono truncate">{id}</div>
                                </li>
                            ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default GroupInfoPanel;
