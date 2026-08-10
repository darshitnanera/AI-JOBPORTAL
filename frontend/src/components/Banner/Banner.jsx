import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowRight,
  PlayCircle,
  ChevronRight,
  Backpack,
  X as CloseIcon,
  CircleChevronRight,
} from "lucide-react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import B1 from "../../assets/bannervideo.mp4";
import { bannerStyles as s } from "../../assets/dummyStyles";

/* --- LottieLogo component (unchanged except style references) --- */
const LottieLogo = ({ src, size = 56, initials = "TV" }) => {
  const containerRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [attemptedPreview, setAttemptedPreview] = useState(false);

  useEffect(() => {
    if (!src || !src.startsWith("http") || attemptedPreview) return;
    let cancelled = false;
    const tryPreview = async () => {
      try {
        const pngUrl = src.replace(/\.lottie(\?.*)?$/i, ".png");
        const resp = await fetch(pngUrl, { method: "HEAD" });
        if (!cancelled && resp.ok) setPreview(pngUrl);
      } catch (e) {
        // ignore
      } finally {
        setAttemptedPreview(true);
      }
    };
    tryPreview();
    return () => {
      cancelled = true;
    };
  }, [src, attemptedPreview]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let observer;
    const checkReady = () => {
      if (el.children.length > 0) {
        setPlayerReady(true);
        return true;
      }
      return false;
    };
    if (!checkReady()) {
      observer = new MutationObserver(() => {
        if (checkReady()) observer.disconnect();
      });
      observer.observe(el, { childList: true, subtree: true });
      const t = setTimeout(() => {
        if (!playerReady) setPlayerReady(true);
      }, 2500);
      return () => {
        clearTimeout(t);
        if (observer) observer.disconnect();
      };
    }
    return () => {
      if (observer) observer.disconnect();
    };
  }, [containerRef, playerReady]);

  const isUrl = typeof src === "string" && src.startsWith("http");

  return (
    <div style={s.logoWrapper(size)} className="logo-wrapper">
      {preview && (
        <img
          src={preview}
          alt="preview"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ ...s.logoPreviewImg, opacity: playerReady ? 0 : 1 }}
        />
      )}

      <div
        aria-hidden
        style={{ ...s.logoBlurOverlay, opacity: playerReady ? 0 : 1 }}
      />

      <div ref={containerRef} style={s.logoContainer(playerReady)}>
        {isUrl ? (
          <DotLottieReact
            src={src}
            autoplay
            loop
            style={{ width: "90%", height: "90%", pointerEvents: "none" }}
          />
        ) : (
          <span style={s.logoFallbackText(size)}>{initials}</span>
        )}
      </div>

      {!isUrl && <div style={s.logoFallbackOverlay(size)}>{initials}</div>}
    </div>
  );
};

/* ---------------- Banner component ---------------- */
const Banner = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const rafRef = useRef(null);

  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const closeBtnRef = useRef(null);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1366,
  );
  const isXL = windowWidth >= 1280;
  const lottieSize = windowWidth < 640 ? 48 : windowWidth < 1024 ? 64 : 72;

  const DEMO_VIDEO_URL = B1;
  const navigate = useNavigate();

  useEffect(() => {
    let t = null;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => setWindowWidth(window.innerWidth), 80);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.offsetWidth * dpr);
      canvas.height = Math.round(canvas.offsetHeight * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const particleCount =
        window.innerWidth < 640 ? 28 : window.innerWidth < 1024 ? 50 : 80;

      if (
        !particlesRef.current ||
        particlesRef.current.length !== particleCount
      ) {
        class Particle {
          constructor() {
            this.reset();
          }
          reset() {
            this.x = Math.random() * canvas.offsetWidth;
            this.y = Math.random() * canvas.offsetHeight;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(99, 102, 241, ${Math.random() * 0.3 + 0.08})`;
            this.waveOffset = Math.random() * Math.PI * 2;
          }
          update() {
            const t = Date.now() * 0.001;
            this.x += this.speedX + Math.sin(t + this.waveOffset) * 0.3;
            this.y += this.speedY + Math.cos(t + this.waveOffset) * 0.3;
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            if (this.x > w) this.x = 0;
            if (this.x < 0) this.x = w;
            if (this.y > h) this.y = 0;
            if (this.y < 0) this.y = h;
          }
          draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
          }
        }
        particlesRef.current = Array.from(
          { length: particleCount },
          () => new Particle(),
        );
      }
    };

    const animate = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.offsetWidth,
        canvas.offsetHeight,
      );
      gradient.addColorStop(0, "rgba(224, 231, 255, 0.08)");
      gradient.addColorStop(1, "rgba(199, 210, 254, 0.04)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const parts = particlesRef.current || [];
      for (let i = 0; i < parts.length; i++) {
        parts[i].update();
        parts[i].draw();
      }

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x;
          const dy = parts[i].y - parts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.45;
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (showVideo) {
      document.body.style.overflow = "hidden";
      setTimeout(() => closeBtnRef.current?.focus(), 80);
    } else {
      document.body.style.overflow = "";
      const v = videoRef.current;
      if (v) {
        try {
          v.pause();
          v.currentTime = 0;
        } catch (e) {}
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

  const jobs = [
    {
      title: "Senior UX Designer",
      company: "TechVision Inc",
      salary: "Rs120K",
      logo: "https://lottie.host/55e1fcfd-54e5-4545-afe8-b06b0e1e3223/3uXf1kfzPm.lottie",
    },
    {
      title: "Frontend Developer",
      company: "WebFlow",
      salary: "Rs95K",
      logo: "https://lottie.host/06822f75-688b-487f-a27a-2db41d82653c/SzSPCXDgL0.lottie",
    },
    {
      title: "Data Scientist",
      company: "DataSphere",
      salary: "Rs140K",
      logo: "https://lottie.host/3fa4cebd-fd6b-44c4-9489-c6b083c011ab/B38QOZuCAN.lottie",
    },
  ];

  return (
    <div className={s.bannerContainer}>
      <canvas ref={canvasRef} className={s.canvas} aria-hidden />

      <div className={s.contentWrapper}>
        <div className={s.maxWidthContainer}>
          <div className={s.grid}>
            {/* Left Column */}
            <div className={s.leftColumn}>
              <div className={s.badgeContainer}>
                <Backpack className={s.badgeIcon} />
                <span className={s.badgeText}>10,000+ Jobs Available Now</span>
              </div>

              <h1 className={s.heading}>
                <span className={s.headingFindYour}>Find Your</span>
                <span className={s.headingDreamJobWrapper}>
                  <span className={s.headingDreamJob}>Dream Job</span>
                  <span className={s.headingUnderline} />
                </span>
              </h1>

              <p className={s.description}>
                Join{" "}
                <span className="font-semibold text-indigo-600">50,000+</span>{" "}
                professionals who found their perfect career match through our
                advanced AI-powered job portal.
              </p>

              <div className={s.buttonsContainer}>
                <button
                  onClick={() => navigate("/jobs")}
                  className={s.findJobsButton}
                >
                  <div className={s.findJobsShine} />
                  <div className={s.findJobsContent}>
                    <span className={s.findJobsText}>Find Jobs Now</span>
                    <ArrowRight className={s.findJobsIcon} />
                  </div>
                  <div className={s.findJobsGlow} />
                </button>

                <button
                  onClick={() => setShowVideo(true)}
                  className={s.watchDemoButton}
                >
                  <PlayCircle className={s.watchDemoIcon} />
                  <span className={s.watchDemoText}>Watch Demo</span>
                  <CircleChevronRight className={s.watchDemoArrow} />
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className={s.rightColumn}>
              <div
                className={`${s.cardContainer} ${
                  isXL ? "hover:rotate-y-12 rotate-0" : "rotate-0"
                }`}
              >
                <div className={s.card}>
                  <div className={s.cardHeader}>
                    <div className="flex items-center gap-3">
                      <div className={s.briefcaseIconContainer}>
                        <Briefcase className={s.briefcaseIcon} />
                      </div>
                      <div>
                        <h3 className={s.featuredTitle}>Featured Jobs</h3>
                        <p className={s.featuredSubtitle}>Updated daily</p>
                      </div>
                    </div>
                  </div>

                  <div className={s.jobsList}>
                    {jobs.map((job, index) => (
                      <div key={index} className={s.jobItem}>
                        <div className={s.jobItemFlex}>
                          <div className={s.jobItemLeft}>
                            <div className={s.jobLogoContainer}>
                              {typeof job.logo === "string" &&
                              job.logo.startsWith("http") ? (
                                <div className="w-full h-full p-1 flex items-center justify-center">
                                  <LottieLogo
                                    src={job.logo}
                                    size={lottieSize}
                                  />
                                </div>
                              ) : (
                                <div className={s.jobFallbackLogo}>
                                  <span className={s.jobFallbackText}>
                                    {job.logo?.charAt(0) || "?"}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className={s.jobTitle}>{job.title}</h4>
                              <p className={s.jobCompany}>{job.company}</p>
                            </div>
                          </div>

                          <div className={s.salaryContainer}>
                            <div className={s.salaryAmount}>{job.salary}</div>
                            <div className={s.salaryPeriod}>per year</div>
                          </div>
                        </div>
                        <div className={s.jobHoverOverlay}></div>
                      </div>
                    ))}
                  </div>

                  <div className={s.viewAllContainer}>
                    <button
                      onClick={() => navigate("/jobs")}
                      className={s.viewAllButton}
                    >
                      <span className={s.viewAllText}>View All Jobs</span>
                      <ChevronRight className={s.viewAllIcon} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Watch demo video"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div
            className={s.modalBackdrop}
            onClick={() => setShowVideo(false)}
          />
          <div className={s.modalPanel}>
            <button
              ref={closeBtnRef}
              onClick={() => setShowVideo(false)}
              aria-label="Close video"
              className={s.modalCloseButton}
            >
              <CloseIcon className={s.modalCloseIcon} />
            </button>
            <div className={s.modalVideoWrapper}>
              <div
                className={s.modalVideoContainerClass}
                style={{ paddingTop: "56.25%" }}
              >
                <video
                  ref={videoRef}
                  src={DEMO_VIDEO_URL}
                  controls
                  autoPlay
                  muted
                  playsInline
                  style={s.modalVideoContainer}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG Wave */}
      <div className={s.waveContainer}>
        <svg
          className={s.waveSvg}
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className={s.wavePathFill}
          />
        </svg>
      </div>

      {/* Global Styles */}
      <style>{s.globalStyles}</style>
    </div>
  );
};

export default Banner;
