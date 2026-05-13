"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { sendOTP, verifyOTP, createAccount } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff, User, AtSign, Shield } from "lucide-react";

type Step = "profile" | "email" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return setError("Username must be 3–20 characters (letters, numbers, underscores).");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setStep("email");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await sendOTP(email);
      setStep("otp");
      setResendTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (otp[index]) { const n = [...otp]; n[index] = ""; setOtp(n); }
      else if (index > 0) inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); inputRefs.current[5]?.focus(); }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return setError("Please enter all 6 digits.");
    setIsLoading(true);
    setError("");
    try {
      await verifyOTP(email, otpCode);
      await createAccount({ email, password, name, username });
      router.replace("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError("");
    try {
      await sendOTP(email);
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = ["Profile", "Email", "Verify"];
  const stepIndex = step === "profile" ? 0 : step === "email" ? 1 : 2;

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <Link href="/" className="inline-block mb-6">
              <div className="w-32 h-10 relative">
                <Image src="/Alphainno App Store Logo.png" alt="Alphainno App Store" fill className="object-contain" />
              </div>
            </Link>

            {/* Step indicator */}
            <div className="flex items-center mb-6">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      i < stepIndex ? "bg-blue-600 text-white" :
                      i === stepIndex ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                      "bg-gray-200 text-gray-500"
                    }`}>
                      {i < stepIndex ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-xs mt-1 ${i === stepIndex ? "text-blue-600 font-medium" : "text-gray-400"}`}>{label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-2 mb-4 ${i < stepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
            )}

            {/* STEP 1: Profile */}
            {step === "profile" && (
              <>
                <h1 className="text-2xl font-bold mb-1">Create your account</h1>
                <p className="text-gray-600 mb-5 text-sm">Set up your profile to get started</p>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="Your full name" required autoFocus />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="your_username" required minLength={3} maxLength={20} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">3–20 characters, letters, numbers, underscores</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showPassword ? "text" : "password"} value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="At least 8 characters" required minLength={8} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="Repeat your password" required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit"
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition mt-2 flex items-center justify-center gap-2 text-sm">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">Sign in</Link>
                </div>
              </>
            )}

            {/* STEP 2: Email */}
            {step === "email" && (
              <>
                <h1 className="text-2xl font-bold mb-1">Add your email</h1>
                <p className="text-gray-600 mb-5 text-sm">We&apos;ll send a verification code to confirm it</p>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                        placeholder="you@example.com" required disabled={isLoading} autoFocus />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    {isLoading ? "Sending code..." : <> Send verification code <ArrowRight className="w-4 h-4" /> </>}
                  </button>
                </form>

                <button onClick={() => { setStep("profile"); setError(""); }}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  ← Back to profile
                </button>
              </>
            )}

            {/* STEP 3: OTP */}
            {step === "otp" && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7 text-blue-600" />
                  </div>
                  <h1 className="text-2xl font-bold mb-1">Verify your email</h1>
                  <p className="text-gray-600 text-sm">We sent a 6-digit code to</p>
                  <p className="text-blue-600 font-medium text-sm">{email}</p>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Verification code</label>
                    <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input key={i} ref={(el) => { inputRefs.current[i] = el; }}
                          type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-11 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition caret-transparent"
                          disabled={isLoading} />
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading || otp.join("").length !== 6}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                    {isLoading ? "Creating account..." : "Verify & Create Account"}
                  </button>
                </form>

                <div className="mt-5 text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Didn&apos;t receive the code?{" "}
                    <button onClick={handleResend} disabled={resendTimer > 0 || isLoading}
                      className="text-blue-600 font-medium hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
                    </button>
                  </p>
                  <button onClick={() => { setStep("email"); setError(""); setOtp(["","","","","",""]); }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    ← Use a different email
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right — branding panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative text-white max-w-lg z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Secure & Simple</h2>
          <p className="text-lg text-blue-100 mb-8">Create your account in seconds with email verification.</p>
          <div className="space-y-5">
            {[
              { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", title: "Email Verification", desc: "Secure account creation with 6-digit OTP" },
              { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", title: "Protected Access", desc: "Your account is secured with encryption" },
              { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Instant Access", desc: "Start downloading apps immediately after signup" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-blue-100">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
