import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const phone = params.get("phone");
  const verifyOtp = useAuthStore((state) => state.verifyOtp);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("OTP is required");

    setLoading(true);
    const success = await verifyOtp({ phone, otp });

    if (success) {
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-base-200">
      <div className="card w-full max-w-sm shadow-2xl bg-base-100">
        <form onSubmit={handleVerify} className="card-body">
          <h1 className="text-2xl font-bold text-center mb-4">Verify OTP</h1>
          <p className="text-sm text-center mb-6 text-base-content/70">
            Enter the OTP sent to {phone}
          </p>

          <div className="form-control">
            <input
              type="text"
              placeholder="Enter OTP"
              className="input input-bordered w-full"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <div className="form-control mt-6">
            <button className="btn btn-primary w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyOtpPage;