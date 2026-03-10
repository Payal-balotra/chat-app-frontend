import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  const phone = params.get("phone");
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length < 6) return toast.error("Please enter full 6-digit OTP");

    setLoading(true);
    const result = await verifyOtp({ phone, otp: otpString });

    if (result.success) {
      navigate(`/profile/${result.user?._id || result.user?.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-base-200 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-base-100 p-10 rounded-3xl shadow-xl border border-base-300">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-base-content tracking-tight">
            Verify Identity
          </h1>
          <p className="mt-2 text-sm text-base-content/60">
            We've sent a code to <span className="font-semibold text-base-content">{phone}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="mt-8 space-y-6">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                className="w-12 h-14 text-center text-2xl font-bold bg-base-200 border-2 border-transparent focus:border-primary focus:bg-base-100 rounded-xl transition-all outline-none"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          <div className="pt-4">
            <button
              className="btn btn-primary w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
              disabled={loading || otp.join("").length < 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="flex items-center justify-center w-full gap-2 text-sm text-base-content/50 hover:text-primary transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Try another number
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;