"use client";
import { useRouter } from "next/navigation";
import { FloatingParticles } from "@/components/auth/FloatingParticles";
import { DiaryBook } from "@/components/auth/DiaryBook";

export default function CoverPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 bg-gradient-to-br from-[#fdf8ec] via-[#f8f3e8] to-[#fbeee0]">
      <FloatingParticles />
      <div className="relative z-10">
        <DiaryBook onAuthenticated={() => router.push("/home")} />
      </div>
    </div>
  );
}