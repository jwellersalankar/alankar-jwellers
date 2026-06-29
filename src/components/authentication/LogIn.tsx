"use client";

import { useState } from "react";
import { CircleUserRound, Lock, Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/src/schemas/signInSchema";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import { signIn } from "next-auth/react";
import { set } from "mongoose";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSignIn = async () => {
    setSubmitting(true);
    // handle auth logic here
    try {
      if (!email || !password) {
        toast({
          title: "Missing fields",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        setError("Please fill in all fields");
        return;
      }


      const response = await signIn("credentials", {
        redirect: false,
        identifier: email,
        password: password,
      });

      console.log("Response: ",response);
      

      if (response?.error) {
        if (response.error === "credentialsSignIn") {
          toast({
            title: "Login failed",
            description: "invalid username or password",
            variant: "destructive",
          });
          setError("invalid username or password");
        } else {
          toast({
            title: "Error",
            description: response?.error,
            variant: "destructive",
          });
          setError(response?.error);
        }
      }

      if (response?.ok) {
  router.replace("/");
}
    } catch (error: any) {
      toast({
        title: "Error occured while log in",
        description: error.message,
        variant: "destructive",
      });
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex">
      {/* ── Left Panel: Brand / Image ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[58%] relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, #2A1A4A 0%, #150D2E 40%, #0D0820 100%)",
        }}
      >
        {/* Subtle dark circle overlays (decorative depth) */}
        {/* <div className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-[#1A0F35]/60 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[20%] right-[10%] w-48 h-48 rounded-full bg-[#1A0F35]/40 blur-2xl pointer-events-none" /> */}

        {/* Marquee text — top */}
        {/* <div className="relative z-10 overflow-hidden">
          <p
            className="text-[#C9A84C] tracking-[0.45em] whitespace-nowrap animate-marquee"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 400,
              letterSpacing: "0.45em",
            }}
          >
            TUEW ONY &nbsp;&nbsp;&nbsp; TUEW ONY &nbsp;&nbsp;&nbsp; TUEW ONY
          </p>
        </div> */}

        {/* Centre: Image placeholder */}
        {/*
          Replace this div with:
          <Image src="/jewellery-login.png" alt="Jewellery" fill className="object-contain object-center" />
        */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div
            className=" rounded-xl"
            style={{ aspectRatio: "1 / 1" }}
          >
            {/* Deep purple gradient placeholder matching jewellery photo bg */}
            {/* <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#2A1A4A] via-[#1A1035] to-[#0D0820]" /> */}
            <img src="./Shop-Location.jpeg" alt="" className="w-full h-full ocject-cover" />
          </div>
        </div>

        {/* Bottom: Tag text */}
        <div className="relative z-10">
          <h2
            className="text-white mb-3"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(22px, 2.8vw, 34px)",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Crafting Legacies Since
            <br />
            1924
          </h2>
          <p
            className="text-white/50 max-w-[380px] leading-[1.7]"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Enter the sanctum of heritage excellence. Your collection of
            timeless masterpieces awaits within.
          </p>

          {/* Bottom marquee */}
          {/* <div className="overflow-hidden mt-6">
            <p
              className="text-white/20 tracking-[0.35em] whitespace-nowrap animate-marquee-slow"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "clamp(14px, 1.8vw, 20px)",
                fontWeight: 400,
              }}
            >
              SAFE &nbsp; SEE &nbsp; WORK &nbsp;&nbsp;&nbsp; SAFE &nbsp; SEE
              &nbsp; WORK &nbsp;&nbsp;&nbsp; SAFE &nbsp; SEE &nbsp; WORK
            </p>
          </div> */}
        </div>

        {/* Gold corner accent — bottom right */}
        <div
          className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, transparent 50%, #C9A84C 50%)",
          }}
        />
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 bg-[#FAF6F1] flex flex-col justify-between px-8 md:px-16 lg:px-20 py-14">
        {/* Spacer top */}
        <div />

        {/* Form block */}
        <div className="w-full max-w-[360px] mx-auto">
          {/* Heading */}
          <h1
            className="text-[#6B1A1A] text-center mb-2"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            Welcome Back
          </h1>
          <p
            className="text-[#9E8A7E] text-center mb-10"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Please enter your credentials to access the vault.
          </p>

          {/* Username / Email */}
          <div className="mb-6">
            <label
              className="block text-[#5C4A3A] tracking-[0.12em] uppercase mb-2"
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              Username / Email
            </label>
            <div className="flex items-center gap-3 bg-white border border-[#DDD0C4] rounded-md px-4 py-3 focus-within:border-[#8B6914] transition-colors duration-200">
              <CircleUserRound
                size={17}
                strokeWidth={1.6}
                className="text-[#B8A898] flex-shrink-0"
              />
              <input
                type="email"
                placeholder="name@lakhhi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#C8B8A8] text-[14px] focus:outline-none"
                style={{ fontFamily: "'Georgia', serif" }}
              />
            </div>
          </div>

          {/* Secret Key / Password */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-[#5C4A3A] tracking-[0.12em] uppercase"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "11px",
                  fontWeight: 600,
                }}
              >
                Secret Key
              </label>
              {/* <button
                className="text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-200"
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Forgot?
              </button> */}
            </div>
            <div className="flex items-center gap-3 bg-white border border-[#DDD0C4] rounded-md px-4 py-3 focus-within:border-[#8B6914] transition-colors duration-200">
              <Lock
                size={16}
                strokeWidth={1.6}
                className="text-[#B8A898] flex-shrink-0"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-transparent text-[#3D2B1F] placeholder-[#B8A898] text-[14px] focus:outline-none tracking-[0.2em]"
                style={{ fontFamily: "'Georgia', serif" }}
              />
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="text-[#B8A898] hover:text-[#8B6914] transition-colors duration-200 flex-shrink-0"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={16} strokeWidth={1.6} />
                ) : (
                  <Eye size={16} strokeWidth={1.6} />
                )}
              </button>
            </div>
          </div>

          <p className="text-[#6B1A1A]">{error}</p>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={submitting}
            className="w-full bg-[#6B1A1A] hover:bg-[#521414] text-white py-4 rounded-md tracking-[0.18em] uppercase transition-colors duration-200"
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {
              submitting ? "Signing In..." : "Sign In"
            }
          </button>
          {/* Sign up link */}
          <p
            className="text-center mt-5 text-[#9E8A7E]"
            style={{ fontFamily: "'Georgia', serif", fontSize: "13px" }}
          >
            you don't have an account?{" "}
            <a
              href="/sign-up"
              className="text-[#8B6914] hover:text-[#5C3D00] transition-colors duration-200 font-semibold"
            >
              Sign up
            </a>
          </p>
        </div>

        {/* Copyright footer */}
        <p
          className="text-center text-[#B8A898] tracking-[0.12em] uppercase"
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: "10px",
            fontWeight: 400,
          }}
        >
          {/* © 2024 Lakhhi Jewellers. All Rights Reserved. */}
        </p>
      </div>

      {/* ── Marquee animation styles ── */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-slow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 12s linear infinite;
        }
        .animate-marquee-slow {
          display: inline-block;
          animation: marquee-slow 18s linear infinite;
        }
      `}</style>
    </div>
  );
}
