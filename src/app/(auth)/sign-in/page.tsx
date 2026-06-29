'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema } from "@/src/schemas/signInSchema";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import Link from "next/link";
import LoginPage from "@/src/components/authentication/LogIn";

export default function signInForm(){
    return (
        <main>
            <LoginPage />
        </main>
    );
}