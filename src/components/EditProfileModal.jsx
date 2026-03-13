import { useState, useEffect } from "react";
import { User, FileText, Loader2, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const EditProfileModal = ({ isOpen, onClose }) => {
    const { authUser, updateProfile } = useAuthStore();
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (authUser) {
            setFormData({
                name: authUser.name || authUser.fullName || "",
                bio: authUser.bio || "",
            });
        }
    }, [authUser, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = authUser?._id || authUser?.id;
        if (!userId) {
            toast.error("User ID not found. Please log in again.");
            return;
        }
        
        setLoading(true);
        try {
            const success = await updateProfile(userId, formData);
            if (success) {
                onClose();
            }
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-md p-0 overflow-hidden rounded-3xl border border-base-300 shadow-2xl">
                <div className="bg-primary/5 p-6 border-b border-base-300 relative">
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-sm btn-circle absolute right-4 top-4"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" /> Edit Profile
                    </h3>
                    <p className="text-sm text-base-content/60 mt-1">Update your personal information</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" /> Display Name
                            </span>
                        </label>
                        <input
                            type="text"
                            required
                            className="input input-bordered w-full focus:input-primary transition-all rounded-xl h-12"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" /> Bio
                            </span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered w-full focus:textarea-primary transition-all rounded-xl min-h-[100px]"
                            placeholder="Tell us about yourself..."
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>

                    <div className="modal-action mt-8">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="btn btn-ghost rounded-xl flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="btn btn-primary rounded-xl flex-1 shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop bg-base-900/40 backdrop-blur-sm" onClick={onClose}></div>
        </div>
    );
};

export default EditProfileModal;
