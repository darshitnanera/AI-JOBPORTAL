import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Globe,
  Briefcase,
  Users,
  ArrowRight,
  Mail,
  Target,
  Zap,
  CheckCircle,
  Lightbulb,
  Globe as World,
  Award,
  Users as Team,
  Clock,
  Star,
} from "lucide-react";
import { candidateStyles as s } from "../../assets/dummyStyles";

const Candidate = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1366,
  );

  const isXL = windowWidth >= 1280;

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

  const handleMouseMove = (e, id) => {
    if (!isXL) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = (id) => {
    setHoveredCard(id);
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
    setMousePosition({ x: 0, y: 0 });
  };

  const cardData = [
    {
      id: 1,
      title: "RECENT GRADUATES",
      icon: <GraduationCap />,
      description:
        "Fresh talent ready to innovate with modern skills and energy.",
      colors: s.cardColors.blue,
      points: [
        { text: "Modern Tech Skills", icon: <Zap className="w-4 h-4" /> },
        { text: "Quick Adaptation", icon: <Clock className="w-4 h-4" /> },
        { text: "Fresh Perspectives", icon: <Lightbulb className="w-4 h-4" /> },
      ],
      stats: "90% tech-proficient",
      statIcon: <Star className="w-4 h-4" />,
    },
    {
      id: 2,
      title: "SKILLED NEWCOMERS",
      icon: <Globe />,
      description: "Global experience meets local opportunity.",
      colors: s.cardColors.emerald,
      points: [
        { text: "Multilingual", icon: <World className="w-4 h-4" /> },
        { text: "Global Perspective", icon: <Globe className="w-4 h-4" /> },
        { text: "Resilient", icon: <Award className="w-4 h-4" /> },
      ],
      stats: "3+ years experience",
      statIcon: <Award className="w-4 h-4" />,
    },
    {
      id: 3,
      title: "CO-OP STUDENTS",
      icon: <Briefcase />,
      description: "Eager learners bridging theory with practice.",
      colors: s.cardColors.violet,
      points: [
        {
          text: "Academic Excellence",
          icon: <GraduationCap className="w-4 h-4" />,
        },
        { text: "Team Collaboration", icon: <Team className="w-4 h-4" /> },
        { text: "Tech Enthusiasts", icon: <Zap className="w-4 h-4" /> },
      ],
      stats: "4.0+ avg GPA",
      statIcon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 4,
      title: "EXPERIENCED PROFESSIONALS",
      icon: <Users />,
      description: "Seasoned experts driving innovation forward.",
      colors: s.cardColors.amber,
      points: [
        { text: "Leadership", icon: <Users className="w-4 h-4" /> },
        { text: "Strategic Insight", icon: <Lightbulb className="w-4 h-4" /> },
        { text: "Mentorship", icon: <Team className="w-4 h-4" /> },
      ],
      stats: "10+ years experience",
      statIcon: <Award className="w-4 h-4" />,
    },
  ];

  return (
    <div className={s.container}>
      <div className={s.innerContainer}>
        {/* Header */}
        <header className={s.header}>
          <div className={s.headerGlowWrapper}>
            <div className={s.headerGlow}>
              <div className={s.headerGlowEffect} />
              <h1 className={s.headerTitle}>
                Our <span className={s.headerSpan}>Candidates</span>
              </h1>
            </div>
          </div>
          <p className={s.headerSubtitle}>
            Discover exceptional talent across four dynamic categories.
          </p>
        </header>

        {/* Grid of flip cards */}
        <div className={s.grid}>
          {cardData.map((card) => {
            const isHovered = hoveredCard === card.id;
            const rotationX = isHovered && isXL ? mousePosition.y * 10 : 0;
            const rotationY = isHovered && isXL ? mousePosition.x * 10 : 0;

            const transformValue =
              isXL && isHovered
                ? `rotateY(180deg) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`
                : isXL
                  ? "rotateY(0deg)"
                  : "none";

            return (
              <div
                key={card.id}
                className={s.cardWrapper}
                onMouseMove={(e) => handleMouseMove(e, card.id)}
                onMouseEnter={() => handleMouseEnter(card.id)}
                onMouseLeave={handleMouseLeave}
                aria-hidden="true"
              >
                {/* glow effect */}
                <div className={`${s.cardGlow} ${card.colors.accent}/20`}></div>

                {/* flip-card container */}
                <div
                  className={`${s.cardContainer} ${s.cardHeight}`}
                  style={{
                    transformStyle: "preserve-3d",
                    perspective: isXL ? "1200px" : "800px",
                    transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: transformValue,
                  }}
                >
                  {/* Front */}
                  <div
                    className={`${s.frontCard} bg-linear-to-br ${card.colors.front}`}
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <div className={s.frontCardOverlay}>
                      <div className={s.frontCardCircle1}></div>
                      <div className={s.frontCardCircle2}></div>
                    </div>

                    <div className={s.frontCardContent}>
                      <div className={s.frontCardIconWrapper}>
                        <div className={s.frontCardIcon}>
                          {React.cloneElement(card.icon, {
                            className: s.frontCardIconSvg,
                          })}
                        </div>
                      </div>

                      <div className={s.frontCardTextContent}>
                        <h3 className={s.frontCardTitle}>{card.title}</h3>
                        <p className={s.frontCardDescription}>
                          {card.description}
                        </p>
                      </div>
                    </div>

                    <div className={s.frontCardStats}>
                      <div className={s.frontCardStatsRow}>
                        <div className={s.frontCardStatsIcon}>
                          {card.statIcon}
                        </div>
                        <div className={s.frontCardStatsText}>
                          <span className={s.frontCardStatsLabel}>
                            {card.stats}
                          </span>
                          <div className={s.frontCardStatsBar}>
                            <div
                              className={`${s.frontCardStatsFill} ${card.colors.accent}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back */}
                  <div
                    className={`${s.backCard} bg-linear-to-br ${card.colors.back}`}
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <div className={s.backCardOverlay}>
                      <div className={s.backCardCircle}></div>
                    </div>

                    <div className={s.backCardContent}>
                      <div className={s.backCardHeader}>
                        <div className={s.backCardHeaderIcon}>
                          <div
                            className={`${s.backCardIcon} ${card.colors.accent}`}
                          >
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <h4 className={s.backCardHeaderTitle}>
                            Key Strengths
                          </h4>
                        </div>
                        <div className={s.backCardDivider} />
                      </div>

                      <div className={s.backCardGrid}>
                        {card.points.map((point, idx) => (
                          <div key={idx} className={s.backCardItem}>
                            <div className={s.backCardItemIcon}>
                              {React.cloneElement(point.icon, {
                                className: s.backCardItemIconSvg,
                              })}
                            </div>
                            <span className={s.backCardItemText}>
                              {point.text}
                            </span>
                            <CheckCircle className={s.backCardItemCheck} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edge border */}
                <div className={s.cardBorder} />
              </div>
            );
          })}
        </div>

        {/* decorative separators */}
        <div className={s.separatorWrapper}>
          <div className={s.separatorLine1} />
          <div className={s.separatorDots}>
            <div className={s.separatorDot1} />
            <div className={s.separatorDot2} />
            <div className={s.separatorDot3} />
          </div>
          <div className={s.separatorLine2} />
        </div>

        {/* CTA */}
        <footer className={s.footer}>
          <button className={s.ctaButton}>
            <div className={s.ctaButtonShine} />
            <div className={s.ctaButtonContent}>
              <div className={s.ctaButtonIcon}>
                <Mail className="w-5 h-5" />
              </div>
              <span className={s.ctaButtonText}>Contact Recruitment Team</span>
              <ArrowRight className={s.ctaButtonArrow} />
            </div>
            <div className={s.ctaButtonGlow} />
          </button>
        </footer>
      </div>

      {/* Styles */}
      <style>{s.globalStyles}</style>
    </div>
  );
};

export default Candidate;
