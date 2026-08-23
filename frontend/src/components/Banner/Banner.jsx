import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowRight,
  PlayCircle,
  ChevronRight,
  Sparkles,
  X as CloseIcon,
} from "lucide-react";

/* Demo video is hosted externally; no local binary in the repo. */
const DEMO_VIDEO_URL =
  "https://drive.google.com/uc?export=download&id=1x00FRMGpVvLu3RiZW2PzeDIbhZ3A7AnL";

const JOBS = [
  {
    title: "Senior UX Designer",
    company: "TechVision Inc",
    salary: "Rs120K",
    logo: "TV",
  },
  {
    title: "Frontend Developer",
    company: "WebFlow",
    salary: "Rs95K",
    logo: "WF",
  },
  {
    title: "Data Scientist",
    company: "DataSphere",
    salary: "Rs140K",
    logo: "DS",
  },
];

const STATS = [
  { value: "10,000+", label: "Jobs available now" },
  { value: "50,000+", label: "Professionals hired" },
  { value: "Daily", label: "Fresh listings" },
];

const Banner = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const closeBtnRef = useRef(null);
  const navigate = useNavigate();

  /* ---- decorative particle field (purely cosmetic, aria-hidden) ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.offsetWidth * dpr);
      canvas.height = Math.round(canvas.offsetHeight * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const particleCount =
        window.innerWidth < 640 ? 24 : window.innerWidth < 1024 ? 44 : 70;

      if (particlesRef.current.length !== particleCount) {
        particlesRef.current = Array.from({ length: particleCount }, () => ({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          size: Math.random() * 2.5 + 1,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
          alpha: Math.random() * 0.25 + 0.08,
          wave: Math.random() * Math.PI * 2,
        }));
      }
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const parts = particlesRef.current;
      const t = Date.now() * 0.001;

      for (const p of parts) {
        p.x += p.speedX + Math.sin(t + p.wave) * 0.3;
        p.y += p.speedY + Math.cos(t + p.wave) * 0.3;
        if (p.x > w) p.x = 0;
        if (p.x < 0) p.x = w;
        if (p.y > h) p.y = 0;
        if (p.y < 0) p.y = h;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
        ctx.fill();
      }

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x;
          const dy = parts[i].y - parts[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.45;
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    resizeCanvas();
    if (prefersReduced) {
      draw();
      cancelAnimationFrame(rafRef.current);
    } else {
      draw();
    }

    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ---- modal body-scroll lock + focus + escape ---- */
  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => closeBtnRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    document.body.style.overflow = "";
    const v = videoRef.current;
    if (v) {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        /* noop */
      }
    }
  }, [showVideo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && showVideo) setShowVideo(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showVideo]);

  return (
    <section className="relative isolate overflow-hidden bg-slate-50 dark:bg-slate-950">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      {/* soft brand wash behind the canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-br from-brand-50 via-slate-50 to-accent-400/10 dark:from-slate-900 dark:via-slate-950 dark:to-brand-950/40"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* ---------------- Left: copy + CTAs ---------------- */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 sm:text-sm dark:bg-brand-500/10 dark:text-brand-300 dark:ring-brand-500/25">
              <Sparkles size={16} aria-hidden="true" />
              10,000+ Jobs Available Now
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-50">
              Find Your{" "}
              <span className="text-gradient-brand">Dream Job</span>
            </h1>

            <p className="mt-5 max-w-xl text-base text-slate-600 sm:text-lg dark:text-slate-400">
              Join{" "}
              <span className="font-semibold text-brand-600 dark:text-brand-400">
                50,000+
              </span>{" "}
              professionals who found their perfect career match through our
              advanced AI-powered job portal.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link
                to="/jobs"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md active:scale-[0.98] sm:text-base"
              >
                <span>Find Jobs Now</span>
                <ArrowRight
                  size={18}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] sm:text-base dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <PlayCircle
                  size={18}
                  aria-hidden="true"
                  className="text-brand-600 dark:text-brand-400"
                />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* ---------------- Stat strip ---------------- */}
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-slate-50">
                    {stat.value}
                  </dd>
                  <p className="mt-1 text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </dl>
          </div>

          {/* ---------------- Right: Featured Jobs card ---------------- */}
          <div className="w-full">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-xl sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Briefcase size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    Featured Jobs
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Updated daily
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-3">
                {JOBS.map((job) => (
                  <li
                    key={`${job.company}-${job.title}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-base font-bold text-white">
                          {job.logo?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-50">
                            {job.title}
                          </h3>
                          <p className="truncate text-xs text-slate-600 sm:text-sm dark:text-slate-400">
                            {job.company}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-brand-600 sm:text-base dark:text-brand-400">
                          {job.salary}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          per year
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
                <Link
                  to="/jobs"
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  View All Jobs
                  <ChevronRight
                    size={16}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- Video modal ---------------- */}
      {showVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Watch demo video"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setShowVideo(false)}
          />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <button
              type="button"
              ref={closeBtnRef}
              onClick={() => setShowVideo(false)}
              aria-label="Close video"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <CloseIcon size={18} aria-hidden="true" />
            </button>
            <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
              <video
                ref={videoRef}
                src={DEMO_VIDEO_URL}
                controls
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Banner;
