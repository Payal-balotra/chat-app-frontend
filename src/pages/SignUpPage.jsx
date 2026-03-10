import { useState } from "react";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const SignUpPage = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      return toast.error("Phone number is required");
    }

    setLoading(true);

    const success = await register(phone);

    if (success) {
      navigate(`/verify-otp?phone=${encodeURIComponent(phone)}`);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <MessageSquare className="mx-auto size-10 text-primary" />
          <h1 className="text-2xl font-bold">Register</h1>
          <p>Enter your phone number</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="relative">
            <Phone className="absolute left-3 top-3 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="+919876543210"
              className="input input-bordered w-full pl-10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin size-5" />
                Sending OTP...
              </>
            ) : (
              "Send OTP"
            )}
          </button>

        </form>
      </div>
    </div>
  );
};

export default SignUpPage;