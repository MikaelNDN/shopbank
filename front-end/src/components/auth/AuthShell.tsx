import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function AuthShell({ children }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b0a18] text-white flex items-center justify-center p-4">
      {/* Backdrop glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-purple-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(11,10,24,0.9)_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_8px_60px_-10px_rgba(139,92,246,0.45)]">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
