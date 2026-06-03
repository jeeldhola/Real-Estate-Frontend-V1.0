import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Asset imports
import logoUrl from "@/assets/svg/sign-in/logo.svg";
import lowerPortionUrl from "@/assets/svg/sign-in/lower-portion.svg";
import sidePortionUrl from "@/assets/svg/sign-in/side-portiuon.svg";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [{ title: "Create Account — Real Estate CRM" }],
  }),
});

function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [countdown, setCountdown] = useState(59);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle Resend Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOtpScreen && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOtpScreen, countdown]);

  async function startSignupOtpFlow(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Calculate initials from name
      const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();

      // Step 1: Query live backend registration without OTP to trigger dispatch
      const res = await api.post<{ requiresOtp: boolean }>("/api/auth/register", {
        name,
        email,
        password,
        initials,
      });

      if (res.requiresOtp) {
        setOtp(["", "", "", "", "", ""]);
        setOtpError(null);
        setCountdown(59);
        setResendCount(0); // Reset resend count on new initial signup flow
        setShowOtpScreen(true);

        toast.success("OTP sent sucessfully");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong during registration");
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyOtpAndRegister(e: FormEvent) {
    e.preventDefault();
    const enteredOtp = otp.join("").toUpperCase();
    if (enteredOtp.length < 6) {
      setOtpError("Please enter all 6 characters.");
      return;
    }

    setVerifyingOtp(true);
    setOtpError(null);

    try {
      const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();

      // Step 2: Complete live registration using OTP code
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        initials,
        otp: enteredOtp,
      });

      // Automatically authenticate session and log in
      await login(email, password, enteredOtp);
      toast.success("Registration successful! Welcome to HubKonnect.");
      navigate({ to: "/", replace: true });
    } catch (err) {
      setOtpError(err instanceof ApiError ? err.message : "This OTP is invalid");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function resendOtp() {
    if (resendCount >= 2) {
      toast.error("Resend limit reached (maximum 2 times).");
      return;
    }
    try {
      const initials = name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 4)
        .toUpperCase();

      await api.post("/api/auth/register", {
        name,
        email,
        password,
        initials,
      });

      setOtp(["", "", "", "", "", ""]);
      setOtpError(null);
      setCountdown(59);
      setResendCount((prev) => prev + 1);
      toast.success("OTP sent sucessfully");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to resend verification code.");
    }
  }

  const handleOtpChange = (val: string, index: number) => {
    const cleanVal = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanVal === "" && val !== "") return;
    
    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1);
    setOtp(newOtp);

    // Focus next input box if typed a character
    if (cleanVal !== "") {
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0 && inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().toUpperCase();
    if (pastedData.length === 6 && /^[A-Z0-9]{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Pane - Form and branding */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-16 md:p-20 overflow-y-auto">
        <div className="my-auto py-4">
          <div className="w-full max-w-[420px] mx-auto space-y-6">
            {/* Logo */}
            <div className="flex justify-center -mb-6">
              <img src={logoUrl} alt="HubKonnect" className="h-28 w-auto object-contain" />
            </div>

            {showOtpScreen ? (
              <form onSubmit={verifyOtpAndRegister} className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-extrabold text-[#1c1c1c] tracking-tight">
                    Verify Your Email
                  </h2>
                  <p className="text-xs text-[#6e6e73] max-w-sm mx-auto">
                    A secure 6-digit registration OTP code has been dispatched to <span className="font-semibold text-gray-800">{email}</span>.
                  </p>
                </div>

                {/* Live OTP Notice Badge */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 flex flex-col items-center justify-center shadow-3xs">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-black uppercase tracking-wider leading-none">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    OTP Code sent to email Successfully
                  </div>
                </div>

                {/* Segmented OTP input boxes */}
                <div className="space-y-1.5">
                  <label className="block text-center text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Enter Verification Code
                  </label>
                  <div className="flex justify-between items-center gap-2 max-w-xs mx-auto">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-12 rounded-xl border border-gray-300 bg-white text-center text-lg font-extrabold text-gray-900 outline-none transition-all focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/10"
                      />
                    ))}
                  </div>
                </div>

                {otpError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-650 text-center animate-in fade-in duration-200">
                    {otpError}
                  </div>
                )}

                {/* Verify Submit Button */}
                <button
                  type="submit"
                  disabled={verifyingOtp}
                  className="w-full bg-[#dd5437] hover:bg-[#c9452b] text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer text-sm flex items-center justify-center gap-2 mt-4"
                >
                  {verifyingOtp && <Loader2 className="h-4 w-4 animate-spin" />}
                  Complete Registration
                </button>

                {/* Resend actions & Go back link */}
                <div className="flex flex-col items-center gap-4 text-xs font-semibold pt-1">
                  {countdown > 0 ? (
                    <span className="text-gray-400">
                      Resend code in <span className="text-gray-600 font-bold">{countdown}s</span>
                    </span>
                  ) : resendCount >= 2 ? (
                    <span className="text-red-500 font-bold">
                      Resend limit reached (max 2 times)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      className="text-[#dd5437] hover:underline cursor-pointer bg-transparent border-0 font-extrabold"
                    >
                      Resend Verification Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpScreen(false);
                      setOtpError(null);
                    }}
                    className="text-gray-400 hover:text-gray-655 cursor-pointer bg-transparent border-0 hover:underline"
                  >
                    Back to registration form
                  </button>
                </div>
              </form>
            ) : (
              <>
                {/* Welcome text */}
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-extrabold text-[#1c1c1c] tracking-tight">
                    Create Account
                  </h1>
                  <p className="text-sm text-[#6e6e73]">
                    Enter your details below to set up your profile
                  </p>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  className="w-full border border-gray-300 rounded-lg py-3 px-4 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.78 0 3.38.61 4.64 1.82l3.46-3.46C17.98 1.43 15.2 0 12 0 7.33 0 3.3 2.67 1.34 6.56l4.08 3.16C6.38 6.96 8.94 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.02 3.67-5 3.67-8.64z" />
                    <path fill="#FBBC05" d="M5.42 14.56c-.24-.72-.38-1.49-.38-2.28 0-.79.14-1.56.38-2.28L1.34 6.84C.48 8.56 0 10.48 0 12.5s.48 3.94 1.34 5.66l4.08-3.6z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.76-2.91c-1.1.74-2.5 1.18-4.2 1.18-3.06 0-5.62-1.92-6.58-4.68l-4.08 3.16C3.3 21.33 7.33 24 12 24z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Separator */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-[#8e8e93] font-semibold">Or</span>
                  </div>
                </div>

                {/* Credentials form */}
                <form onSubmit={startSignupOtpFlow} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Email
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="youremail@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="Create a strong password (min 8 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white pl-3.5 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#dd5437] focus:ring-2 focus:ring-[#dd5437]/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-650">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#dd5437] hover:bg-[#c9452b] text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer text-sm flex items-center justify-center gap-2 mt-4"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Sign Up
                  </button>
                </form>
              </>
            )}

            {/* Signup offer */}
            <p className="text-sm text-center text-gray-555 pt-2">
              Already have an account?{" "}
              <Link to="/login" className="text-[#dd5437] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          {/* Lower portion features */}
          <div className="mt-12 flex justify-center">
            <img
              src={lowerPortionUrl}
              alt="CRM Features: Expert Technicians, Reliable, Support"
              className="w-full max-w-[480px] h-auto object-contain"
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-12">
          2026 The Appliance Guys. All Rights Reserved
        </p>
      </div>

      {/* Right Pane - Feature image banner */}
      <div className="hidden lg:block lg:w-1/2 p-6">
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-[#fafafa]">
          <img
            src={sidePortionUrl}
            alt="One less thing to stress about - HubKonnect"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    </div>
  );
}
