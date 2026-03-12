"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { ArrowRight, FileText, Mic2, Sparkles, Volume2 } from "lucide-react";

const features = [
  {
    title: "Text → Text",
    description: "Translate content between languages with high accuracy.",
    icon: FileText,
  },
  {
    title: "Text → Speech",
    description: "Generate natural speech from text in multiple voices.",
    icon: Volume2,
  },
  {
    title: "Speech → Speech",
    description: "Transcribe and transform audio with AI-driven workflows.",
    icon: Mic2,
  },
];

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.13,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

function AnimatedOrb({ className }: { className: string }) {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function LandingPage() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useTransform(mouseX, [0, 1], [-18, 18]);
  const bgY = useTransform(mouseY, [0, 1], [-18, 18]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  return (
    <main
      className="relative flex min-h-screen items-center overflow-hidden px-4 py-8 sm:px-8"
      onMouseMove={handleMouseMove}
    >
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: bgX, y: bgY }}
          className="absolute left-[-12%] top-[-18%] h-[420px] w-[420px]"
        >
          <AnimatedOrb className="h-full w-full rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.22)_0%,_transparent_68%)] blur-3xl" />
        </motion.div>
        <motion.div
          style={{ x: useTransform(bgX, (v) => -v), y: useTransform(bgY, (v) => -v) }}
          className="absolute bottom-[-22%] right-[-10%] h-[440px] w-[440px]"
        >
          <AnimatedOrb className="h-full w-full rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.20)_0%,_transparent_68%)] blur-3xl" />
        </motion.div>
      </div>

      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-4xl mx-auto"
      >
        <div className="text-center">
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-block">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white px-4 py-1.5 text-sm font-semibold text-sky-700 shadow-sm"
            >
              <motion.span
                animate={{ rotate: [0, 15, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles size={14} />
              </motion.span>
              Intelligent Multilingual Workflows
            </motion.div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="mt-6 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl md:text-[3.5rem]"
          >
            MultiLingua Speech Engine
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg"
          >
            Convert speech and text seamlessly across multiple languages using AI.
          </motion.p>

          {/* CTA Button */}
          <motion.div variants={itemVariants} className="mt-7">
            <motion.div
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="inline-block"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-500 px-7 py-3.5 text-base font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.28)] transition-shadow duration-300 hover:shadow-[0_18px_34px_rgba(14,165,233,0.36)]"
              >
                Experience MultiLingua Engine
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRight size={20} />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature cards */}
        <motion.div
          variants={containerVariants}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {features.map(({ title, description, icon: Icon }) => (
            <motion.article
              key={title}
              variants={cardVariants}
              whileHover={{ y: -6, scale: 1.02, boxShadow: "0 20px 40px rgba(15,23,42,0.13)" }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur cursor-default"
            >
              <motion.div
                whileHover={{ rotate: [0, -8, 8, 0], scale: 1.12 }}
                transition={{ duration: 0.5 }}
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700"
              >
                <Icon size={18} />
              </motion.div>
              <h2 className="font-display text-base font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.section>
    </main>
  );
}
