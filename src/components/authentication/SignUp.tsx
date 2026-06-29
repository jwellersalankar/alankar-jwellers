"use client";

import { useState } from "react";
import { CircleUserRound, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "../ui/use-toast";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";

type SignupForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldError = Partial<Record<keyof SignupForm, string>>;

export default function SignupPage() {
  const [form, setForm] = useState<SignupForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();

  const set = (key: keyof SignupForm, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email.trim()) e.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (!form.confirmPassword) e.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async() => {
    if (validate()) {
      // handle signup logic here
      setSubmitting(true);
     try {
            const data = {
                name: form.name,
                email: form.email,
                password: form.password,
            }
            const response = await axios.post(`/api/sign-up`,data);
            const responseData = await response.data;
            

            if (responseData.success) {
                toast({
                    title: 'sign-up successful',
                    description: responseData.message,
                    variant: 'default',
                });
                router.replace('/sign-in');
            }

        } catch (error) {
            console.error('Sign-up failed:', error);
            const axiosError = error as any;

            let errorMessage = axiosError.response?.data.message;
            console.error('Sign-up failed:', errorMessage || error);

            toast(
                {
                    title: 'sign-up failed',
                    description: errorMessage,
                    variant: 'destructive',
                },
            );
        } finally {
            setSubmitting(false);
        }
    }
  };

  return (
    <div className="h-screen flex">

      {/* ── Left Panel: Brand ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[56%] relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 55% 45%, #2A1A0E 0%, #1C0F0A 45%, #0E0806 100%)",
        }}
      >
        {/* Decorative glow blobs */}
        {/* <div className="absolute top-[15%] left-[8%] w-72 h-72 rounded-full bg-[#8B2020]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[25%] right-[5%] w-56 h-56 rounded-full bg-[#C9A84C]/8 blur-2xl pointer-events-none" /> */}

        {/* Top marquee */}
        {/* <div className="relative z-10 overflow-hidden">
          <p
            className="text-[#C9A84C] tracking-[0.45em] whitespace-nowrap animate-marquee"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(20px, 2.8vw, 34px)",
              fontWeight: 400,
            }}
          >
            LAKHHI JEWELLERS &nbsp;&nbsp;&nbsp; LAKHHI JEWELLERS &nbsp;&nbsp;&nbsp; LAKHHI JEWELLERS
          </p>
        </div> */}

        {/* Centre decorative emblem */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            {/* SVG Floral Emblem */}
            {/* <div
              className="w-[140px] h-[140px] rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #5C1A1A 0%, #3A0F0F 100%)", border: "2px solid #8B6914" }}
            >
              <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-[120px] h-[120px]">
                <circle cx="40" cy="40" r="38" fill="#5C1A1A" />
                <circle cx="40" cy="40" r="35" fill="none" stroke="#C9A84C" strokeWidth="0.8" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <ellipse
                    key={i}
                    cx="40"
                    cy="40"
                    rx="5"
                    ry="13"
                    fill="#C9A84C"
                    opacity="0.85"
                    transform={`rotate(${angle} 40 40) translate(0 -13)`}
                  />
                ))}
                <circle cx="40" cy="40" r="7" fill="#C9A84C" />
                <circle cx="40" cy="40" r="3.5" fill="#5C1A1A" />
              </svg>
            </div> */}

            {/* Brand text below emblem */}
            {/* <div className="text-center">
              <p
                className="text-[#C9A84C] tracking-[0.3em] uppercase mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "14px", fontWeight: 400 }}
              >
                Lakhhi Jewellers
              </p>
              <p
                className="text-white/30 tracking-[0.15em] uppercase"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px" }}
              >
                Excellence in Heritage Since 1924
              </p>
            </div> */}

            {/* Decorative gold divider */}
            {/* <div className="flex items-center gap-3 mt-2">
              <div className="w-16 h-px bg-[#C9A84C]/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/60" />
              <div className="w-16 h-px bg-[#C9A84C]/40" />
            </div> */}
          </div>
          <img src="./Shop-Location.jpeg" alt="" className="w-full h-full object-cover" />
        </div>

        {/* Bottom copy */}
        <div className="relative z-10">
          {/* <h2
            className="text-white mb-3"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(20px, 2.5vw, 30px)",
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Begin Your Heritage
            <br />
            Journey Today.
          </h2> */}
          {/* <p
            className="text-white/40 max-w-[360px] leading-[1.7]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
          >
            Create your account to access the vault of timeless craftsmanship
            and bespoke luxury at Lakhhi Jewellers.
          </p> */}

          {/* Bottom marquee */}
          {/* <div className="overflow-hidden mt-6">
            <p
              className="text-white/15 tracking-[0.3em] whitespace-nowrap animate-marquee-slow"
              style={{ fontFamily: "'Georgia', serif", fontSize: "clamp(12px, 1.6vw, 18px)" }}
            >
              TRUST &nbsp; CRAFT &nbsp; LEGACY &nbsp;&nbsp;&nbsp; TRUST &nbsp; CRAFT &nbsp; LEGACY &nbsp;&nbsp;&nbsp; TRUST &nbsp; CRAFT &nbsp; LEGACY
            </p>
          </div> */}
        </div>

        {/* Gold corner accent */}
        {/* <div
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 50%, #C9A84C 50%)" }}
        /> */}
      </div>

      {/* ── Right Panel: Signup Form ── */}
      <div className="flex-1 bg-[#FAF6F1] flex flex-col justify-between px-8 md:px-14 lg:px-16 py-14">

        <div />

        {/* Form block */}
        <div className="w-full max-w-[380px] mx-auto">

          {/* Heading */}
          <p
            className="text-[#8B6914] tracking-[0.18em] uppercase text-center mb-2"
            style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 700 }}
          >
            Personnel Registration
          </p>
          <h1
            className="text-[#6B1A1A] text-center mb-2"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(24px, 3vw, 34px)",
              fontWeight: 700,
            }}
          >
            Create Account
          </h1>
          <p
            className="text-[#9E8A7E] text-center mb-10"
            style={{ fontFamily: "'Georgia', serif", fontSize: "14px" }}
          >
            Register to access your heritage vault.
          </p>

          {/* Fields */}
          <div className="flex flex-col gap-5">

            {/* Full Name */}
            <div>
              <label
                className="block text-[#5C4A3A] tracking-[0.12em] uppercase mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
              >
                Full Name
              </label>
              <div
                className={`flex items-center gap-3 bg-white border rounded-md px-4 py-3 transition-colors duration-200 ${
                  errors.name ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
                }`}
              >
                <CircleUserRound size={17} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Rahul Varma"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[14px] focus:outline-none"
                  style={{ fontFamily: "'Georgia', serif" }}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-[#C0392B]" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-[#5C4A3A] tracking-[0.12em] uppercase mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
              >
                Email Address
              </label>
              <div
                className={`flex items-center gap-3 bg-white border rounded-md px-4 py-3 transition-colors duration-200 ${
                  errors.email ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
                }`}
              >
                <Mail size={16} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0" />
                <input
                  type="email"
                  placeholder="name@lakhhi.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[14px] focus:outline-none"
                  style={{ fontFamily: "'Georgia', serif" }}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-[#C0392B]" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[#5C4A3A] tracking-[0.12em] uppercase mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
              >
                Password
              </label>
              <div
                className={`flex items-center gap-3 bg-white border rounded-md px-4 py-3 transition-colors duration-200 ${
                  errors.password ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
                }`}
              >
                <Lock size={16} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[14px] focus:outline-none tracking-[0.1em]"
                  style={{ fontFamily: "'Georgia', serif" }}
                />
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#B8A898] hover:text-[#8B6914] transition-colors duration-200"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[#C0392B]" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                className="block text-[#5C4A3A] tracking-[0.12em] uppercase mb-2"
                style={{ fontFamily: "'Georgia', serif", fontSize: "10px", fontWeight: 600 }}
              >
                Confirm Password
              </label>
              <div
                className={`flex items-center gap-3 bg-white border rounded-md px-4 py-3 transition-colors duration-200 ${
                  errors.confirmPassword ? "border-[#C0392B]" : "border-[#DDD0C4] focus-within:border-[#8B6914]"
                }`}
              >
                <Lock size={16} strokeWidth={1.6} className="text-[#B8A898] flex-shrink-0" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[14px] focus:outline-none tracking-[0.1em]"
                  style={{ fontFamily: "'Georgia', serif" }}
                />
                <button
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-[#B8A898] hover:text-[#8B6914] transition-colors duration-200"
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[#C0392B]" style={{ fontFamily: "'Georgia', serif", fontSize: "11px" }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full mt-8 bg-[#6B1A1A] hover:bg-[#521414] text-white py-4 rounded-md tracking-[0.18em] uppercase transition-colors duration-200"
            style={{ fontFamily: "'Georgia', serif", fontSize: "13px", fontWeight: 600 }}
          >
            {
              submitting ? "Signing Up..." : "Sign Up"
            }
          </button>

          {/* Sign in link */}
          <p
            className="text-center mt-5 text-[#9E8A7E]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
          >
            Already have an account?{" "}
            <a
              href="/sign-in"
              className="text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-200 font-semibold"
            >
              Sign In
            </a>
          </p>
        </div>

        {/* Copyright */}
        <p
          className="text-center text-[#B8A898] tracking-[0.12em] uppercase"
          style={{ fontFamily: "'Georgia', serif", fontSize: "10px" }}
        >
          {/* © 2024 Lakhhi Jewellers. All Rights Reserved. */}
        </p>
      </div>

      {/* Marquee animations */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-slow {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 14s linear infinite;
        }
        .animate-marquee-slow {
          display: inline-block;
          animation: marquee-slow 20s linear infinite;
        }
      `}</style>
    </div>
  );
}