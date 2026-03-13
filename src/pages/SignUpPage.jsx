import { useState } from "react";
import { Loader2, MessageSquare, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const SignUpPage = () => {
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      return toast.error("Phone number is required");
    }

    if (phone.length !== 10) {
      return toast.error("Phone number must be exactly 10 digits");
    }

    setLoading(true);

    const fullPhone = countryCode + phone;
    const { success, alreadyLogged } = await register(fullPhone);
    setLoading(false);

    if (success) {
      if (alreadyLogged) {
        navigate("/");
      } else {
        navigate(`/verify-otp?phone=${encodeURIComponent(fullPhone)}`);
      }
    }
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

          <div className="flex gap-2">
            <select
              className="select select-bordered w-24 px-2"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+971">+971</option>
              <option value="+61">+61</option>
            </select>
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-3 size-5 text-gray-400" />
              <input
                type="text"
                placeholder="Mobile number"
                className="input input-bordered w-full pl-10"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
              />
            </div>
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