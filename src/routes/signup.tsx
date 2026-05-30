import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { api, ApiError } from "@/lib/api";
import { Loader2, Eye, EyeOff } from "lucide-react";

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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

      // Register the user
      await api.post("/api/auth/register", {
        name,
        email,
        password,
        initials,
      });

      // Automatically log them in
      await login(email, password);
      navigate({ to: "/", replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong during signup");
    } finally {
      setSubmitting(false);
    }
  }

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
            <form onSubmit={onSubmit} className="space-y-4">
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
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
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

            {/* Signup offer */}
            <p className="text-sm text-center text-gray-500 pt-2">
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
