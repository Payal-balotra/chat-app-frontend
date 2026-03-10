import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { User, FileText, Loader2, Sparkles } from "lucide-react";

const ProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { createProfile } = useAuthStore();
    
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const success = await createProfile(id, formData);
        if (success) {
            navigate("/");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-base-100 p-10 rounded-3xl shadow-2xl border border-base-300 relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
                
                <div className="relative">
                    <div className="flex justify-center">
                        <div className="p-4 bg-primary/10 rounded-2xl ring-8 ring-primary/5">
                            <Sparkles className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-base-content tracking-tight">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-base-content/60">
                        Help others recognize you in the chat
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary" /> Full Name
                                </span>
                            </label>
                            <input
                                type="text"
                                required
                                className="input input-bordered w-full focus:input-primary transition-all rounded-xl h-12"
                                placeholder="John Doe"
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
                                placeholder="Tell us a bit about yourself..."
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                "Finish Setup"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
