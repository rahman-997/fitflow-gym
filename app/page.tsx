"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const features = [
  {
    icon: "target",
    eyebrow: "Built for you",
    title: "Personalized Workouts",
    description: "Choose a goal and weekly rhythm to generate a clear place to start.",
  },
  {
    icon: "coach",
    eyebrow: "Guided by the product",
    title: "Guided Sessions",
    description: "Use structured programs and built-in interval presets without needing an account.",
  },
  {
    icon: "chart",
    eyebrow: "Momentum, measured",
    title: "Track Your Progress",
    description: "Complete sessions, see weekly progress, and keep your current week on this device.",
  },
] as const;

const programs = [
  {
    category: "strength",
    imageClass: "program-image--strength",
    name: "Strength Training",
    description: "Build power with progressive, technique-first sessions.",
    level: "Intermediate",
    duration: "45 min",
  },
  {
    category: "cardio",
    imageClass: "program-image--cardio",
    name: "Cardio",
    description: "Build endurance through simple, structured conditioning sessions.",
    level: "All levels",
    duration: "30 min",
  },
  {
    category: "mind-body",
    imageClass: "program-image--yoga",
    name: "Yoga Flow",
    description: "Move with control, breathe deeply, and reset your focus.",
    level: "Beginner",
    duration: "35 min",
  },
  {
    category: "cardio",
    imageClass: "program-image--hiit",
    name: "HIIT",
    description: "Short, focused intervals that challenge the whole body.",
    level: "Advanced",
    duration: "25 min",
  },
  {
    category: "mind-body",
    imageClass: "program-image--mobility",
    name: "Mobility",
    description: "Improve range of motion and practice controlled movement.",
    level: "All levels",
    duration: "20 min",
  },
  {
    category: "strength",
    imageClass: "program-image--fullbody",
    name: "Full Body Workout",
    description: "Train major movement patterns in one balanced session.",
    level: "Intermediate",
    duration: "50 min",
  },
] as const;

const programFilters = [
  { value: "all", label: "All programs" },
  { value: "strength", label: "Strength" },
  { value: "cardio", label: "Cardio" },
  { value: "mind-body", label: "Mind & body" },
] as const;

const journeySteps = [
  {
    number: "01",
    title: "Choose your goal",
    description: "Pick the training direction that matters most right now.",
  },
  {
    number: "02",
    title: "Set your rhythm",
    description: "Choose how many days you realistically want to train each week.",
  },
  {
    number: "03",
    title: "Train and track",
    description: "Use the guided tools and keep completion state on your device.",
  },
] as const;

const planRecommendations = {
  strength: {
    name: "Full Body Foundations",
    focus: "Progressive strength + recovery",
    accent: "Build strength",
  },
  conditioning: {
    name: "Cardio Engine",
    focus: "Intervals + endurance",
    accent: "Build fitness",
  },
  mobility: {
    name: "Move Better",
    focus: "Mobility + controlled strength",
    accent: "Move freely",
  },
} as const;

const weeklySessions = [
  { id: "upper", day: "MON", title: "Upper Body", type: "Strength", duration: "45 min", icon: "↗" },
  { id: "engine", day: "WED", title: "Cardio Engine", type: "Conditioning", duration: "30 min", icon: "⌁" },
  { id: "reset", day: "FRI", title: "Mobility Reset", type: "Recovery", duration: "20 min", icon: "○" },
  { id: "full", day: "SUN", title: "Full Body", type: "Strength", duration: "50 min", icon: "◇" },
] as const;

const timerPresets = [
  { label: "Quick HIIT", detail: "20s work · 10s rest", work: 20, rest: 10, rounds: 8 },
  { label: "Strength", detail: "45s work · 20s rest", work: 45, rest: 20, rounds: 6 },
  { label: "Mobility", detail: "60s move · 15s reset", work: 60, rest: 15, rounds: 4 },
] as const;

const faqs = [
  {
    question: "Do I need gym equipment?",
    answer: "No. The product concept includes programs that can be adapted to a gym, basic equipment, or bodyweight-only training.",
  },
  {
    question: "Can beginners use FitFlow?",
    answer: "Yes. Program cards include level guidance and session length so users can choose an appropriate starting point.",
  },
  {
    question: "How often can I plan to train?",
    answer: "The plan builder supports a weekly rhythm from two to five training days.",
  },
  {
    question: "Will my weekly progress be saved?",
    answer: "Yes. Completed sessions are stored locally on your device so the current week is restored when you return.",
  },
] as const;

function FeatureIcon({ type }: { type: string }) {
  if (type === "target") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" />
      </svg>
    );
  }

  if (type === "coach") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 7h14M5 12h14M5 17h9" />
        <circle cx="18" cy="17" r="2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19V9M10 19V5M16 19v-7M22 19V2" />
      <path d="m3 14 7-6 6 3 6-7" />
    </svg>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeProgramFilter, setActiveProgramFilter] = useState("all");
  const [planGoal, setPlanGoal] = useState<keyof typeof planRecommendations>("strength");
  const [planDays, setPlanDays] = useState(3);
  const [planReady, setPlanReady] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<string[]>([]);
  const [trackerReady, setTrackerReady] = useState(false);
  const [timerPresetIndex, setTimerPresetIndex] = useState(0);
  const [timerPhase, setTimerPhase] = useState<"work" | "rest" | "done">("work");
  const [timerRound, setTimerRound] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState<number>(timerPresets[0].work);
  const [timerRunning, setTimerRunning] = useState(false);

  const closeMenu = () => setMenuOpen(false);
  const filteredPrograms = activeProgramFilter === "all"
    ? programs
    : programs.filter((program) => program.category === activeProgramFilter);
  const recommendedPlan = planRecommendations[planGoal];
  const weeklyProgress = Math.round((completedSessions.length / weeklySessions.length) * 100);
  const activeTimerPreset = timerPresets[timerPresetIndex];
  const timerPhaseTotal = timerPhase === "rest" ? activeTimerPreset.rest : activeTimerPreset.work;
  const timerProgress = timerPhase === "done" ? 100 : Math.round((1 - timerSeconds / timerPhaseTotal) * 100);

  useEffect(() => {
    const hydrateTracker = () => {
      try {
        const savedSessions = JSON.parse(localStorage.getItem("fitflow-week") ?? "[]");
        if (Array.isArray(savedSessions)) setCompletedSessions(savedSessions.filter((item): item is string => typeof item === "string"));
      } catch {
        try {
          localStorage.removeItem("fitflow-week");
        } catch {
          // Storage can be unavailable in hardened browser contexts.
        }
      }
      setTrackerReady(true);
    };

    const timer = window.setTimeout(hydrateTracker, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    const preset = timerPresets[timerPresetIndex];
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current > 1) return current - 1;

        if (timerPhase === "work") {
          setTimerPhase("rest");
          return preset.rest;
        }

        if (timerRound >= preset.rounds) {
          setTimerRunning(false);
          setTimerPhase("done");
          return 0;
        }

        setTimerRound((round) => round + 1);
        setTimerPhase("work");
        return preset.work;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning, timerPhase, timerRound, timerPresetIndex]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const persistSessions = (sessions: string[]) => {
    try {
      localStorage.setItem("fitflow-week", JSON.stringify(sessions));
    } catch {
      // The UI still works when storage is unavailable; persistence is best effort.
    }
  };

  const toggleSession = (sessionId: string) => {
    setCompletedSessions((current) => {
      const next = current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : [...current, sessionId];
      persistSessions(next);
      return next;
    });
  };

  const resetWeek = () => {
    setCompletedSessions([]);
    try {
      localStorage.removeItem("fitflow-week");
    } catch {
      // Ignore unavailable storage.
    }
  };

  const selectTimerPreset = (index: number) => {
    setTimerPresetIndex(index);
    setTimerPhase("work");
    setTimerRound(1);
    setTimerSeconds(timerPresets[index].work);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerPhase("work");
    setTimerRound(1);
    setTimerSeconds(activeTimerPreset.work);
    setTimerRunning(false);
  };

  const toggleTimer = () => {
    if (timerPhase === "done") {
      setTimerPhase("work");
      setTimerRound(1);
      setTimerSeconds(activeTimerPreset.work);
      setTimerRunning(true);
      return;
    }
    setTimerRunning((running) => !running);
  };

  const formattedTimer = `${String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:${String(timerSeconds % 60).padStart(2, "0")}`;

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>

      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="#home" aria-label="FitFlow home" onClick={closeMenu}>
            <span className="brand-mark" aria-hidden="true"><span /><span /></span>
            <span>FitFlow</span>
          </a>

          <button
            className={`menu-toggle${menuOpen ? " is-open" : ""}`}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span /><span /><span />
          </button>

          <nav id="primary-navigation" className={`primary-nav${menuOpen ? " is-open" : ""}`} aria-label="Primary navigation">
            <a href="#home" onClick={closeMenu}>Home</a>
            <a href="#programs" onClick={closeMenu}>Programs</a>
            <a href="#plan-builder" onClick={closeMenu}>Planner</a>
            <a href="#my-week" onClick={closeMenu}>My Week</a>
            <a href="#flow-timer" onClick={closeMenu}>Timer</a>
            <a href="#contact" onClick={closeMenu}>Contact</a>
            <a className="button button--small button--dark nav-cta" href="#get-started" onClick={closeMenu}>
              Get Started <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="hero" id="home" aria-labelledby="hero-title">
          <div className="hero-glow hero-glow--one" aria-hidden="true" />
          <div className="hero-glow hero-glow--two" aria-hidden="true" />

          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow eyebrow--light"><span /> Training that moves with you</p>
              <h1 id="hero-title">Build a Stronger,<span> Healthier You</span></h1>
              <p className="hero-description">
                A local-first fitness PWA with program discovery, plan recommendations, guided intervals, and weekly progress tracking.
              </p>
              <div className="hero-actions">
                <a className="button button--lime" href="#plan-builder">
                  Build My Plan <span className="button-icon" aria-hidden="true">↗</span>
                </a>
                <a className="text-link text-link--light" href="#about">See how it works <span aria-hidden="true">↓</span></a>
              </div>
              <div className="hero-proof" aria-label="FitFlow product capabilities">
                <div>
                  <p><strong>Local-first</strong> progress with an offline-ready core.</p>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-label="FitFlow training experience">
              <div className="hero-image-wrap">
                <Image
                  src="/assets/fitflow-hero.png"
                  alt="Athletes completing a guided strength workout in a modern gym"
                  width={1672}
                  height={941}
                  priority
                />
                <div className="hero-image-shade" aria-hidden="true" />
              </div>
              <div className="metric-card metric-card--top">
                <span className="metric-icon" aria-hidden="true">⌁</span>
                <span><strong>Guided</strong> interval timer</span>
              </div>
              <div className="metric-card metric-card--bottom">
                <span className="metric-icon" aria-hidden="true">✓</span>
                <span><small>Progress</small><strong>Saved on-device</strong></span>
              </div>
              <p className="vertical-label" aria-hidden="true">MOVE • BUILD • THRIVE</p>
            </div>
          </div>

          <div className="container hero-stats" aria-label="FitFlow engineering capabilities">
            <div><strong>PWA</strong><span>installable experience</span></div>
            <div><strong>Local-first</strong><span>device-saved progress</span></div>
            <div><strong>Accessible</strong><span>keyboard + reduced motion</span></div>
            <p>Built as a product.<br /><span>Not a static landing page.</span></p>
          </div>
        </section>

        <section className="section features" id="about" aria-labelledby="features-title">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow"><span /> Why FitFlow</p>
                <h2 id="features-title">Everything you need<br />to keep moving forward.</h2>
              </div>
              <p className="section-intro">A focused training product that combines planning, guided sessions, local persistence, and responsive interaction.</p>
            </div>

            <div className="feature-grid">
              {features.map((feature, index) => (
                <article className="feature-card" key={feature.title}>
                  <span className="card-number" aria-hidden="true">0{index + 1}</span>
                  <span className="feature-icon"><FeatureIcon type={feature.icon} /></span>
                  <p className="card-eyebrow">{feature.eyebrow}</p>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <a href={index === 0 ? "#plan-builder" : index === 1 ? "#flow-timer" : "#my-week"} aria-label={`Explore ${feature.title}`}>
                    Explore feature <span aria-hidden="true">↗</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="journey" aria-labelledby="journey-title">
          <div className="container journey-grid">
            <div className="journey-intro">
              <p className="eyebrow eyebrow--light"><span /> Simple by design</p>
              <h2 id="journey-title">Your weekly flow,<br /><em>three steps away.</em></h2>
              <p>FitFlow turns a broad training goal into a simple weekly product flow.</p>
              <a className="button button--lime" href="#plan-builder">Build My Plan <span className="button-icon" aria-hidden="true">↗</span></a>
            </div>
            <ol className="journey-steps">
              {journeySteps.map((step) => (
                <li key={step.number}>
                  <span>{step.number}</span>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                  <span aria-hidden="true">↗</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section programs" id="programs" aria-labelledby="programs-title">
          <div className="container">
            <div className="section-heading section-heading--split programs-heading">
              <div>
                <p className="eyebrow"><span /> Find your flow</p>
                <h2 id="programs-title">A program for<br />different training goals.</h2>
              </div>
              <div>
                <p className="section-intro">Filter the library by training style and compare level, session length, and focus.</p>
                <a className="text-link" href="#program-list">Explore programs <span aria-hidden="true">→</span></a>
              </div>
            </div>

            <div className="program-toolbar" aria-label="Filter fitness programs">
              {programFilters.map((filter) => (
                <button
                  className={activeProgramFilter === filter.value ? "is-active" : ""}
                  type="button"
                  aria-pressed={activeProgramFilter === filter.value}
                  onClick={() => setActiveProgramFilter(filter.value)}
                  key={filter.value}
                >
                  {filter.label}
                </button>
              ))}
              <span aria-live="polite">{filteredPrograms.length} programs</span>
            </div>

            <div className="program-grid" id="program-list">
              {filteredPrograms.map((program, index) => (
                <article className="program-card" key={program.name}>
                  <div className={`program-image ${program.imageClass}`}>
                    <Image
                      src="/assets/fitflow-programs-grid.png"
                      alt={`${program.name} fitness session`}
                      width={1536}
                      height={1024}
                    />
                    <span className="program-index" aria-hidden="true">0{index + 1}</span>
                  </div>
                  <div className="program-content">
                    <div className="program-meta"><span>{program.level}</span><span>{program.duration}</span></div>
                    <h3>{program.name}</h3>
                    <p>{program.description}</p>
                    <a href="#plan-builder" aria-label={`Use ${program.name} in the plan flow`}>Use in plan <span aria-hidden="true">↗</span></a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="plan-builder" id="plan-builder" aria-labelledby="plan-builder-title">
          <div className="container plan-builder-shell">
            <div className="plan-builder-copy">
              <p className="eyebrow"><span /> Personalized in seconds</p>
              <h2 id="plan-builder-title">Build a plan that<br /><em>fits your real life.</em></h2>
              <p>Choose a goal and weekly rhythm to generate a simple starting recommendation.</p>
              <div className="plan-trust">
                <span aria-hidden="true">✓</span> No sign-up needed
                <span aria-hidden="true">✓</span> Stored locally
              </div>
            </div>

            <div className="plan-form" aria-label="Personalized training plan builder">
              <fieldset>
                <legend>1. What is your main goal?</legend>
                <div className="choice-grid choice-grid--goals">
                  {([
                    ["strength", "Build strength"],
                    ["conditioning", "Build fitness"],
                    ["mobility", "Move better"],
                  ] as const).map(([value, label]) => (
                    <button
                      type="button"
                      className={planGoal === value ? "is-active" : ""}
                      aria-pressed={planGoal === value}
                      onClick={() => { setPlanGoal(value); setPlanReady(false); }}
                      key={value}
                    >
                      <span aria-hidden="true">{value === "strength" ? "↗" : value === "conditioning" ? "⌁" : "○"}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend>2. How many days can you train?</legend>
                <div className="choice-grid choice-grid--days">
                  {[2, 3, 4, 5].map((days) => (
                    <button
                      type="button"
                      className={planDays === days ? "is-active" : ""}
                      aria-pressed={planDays === days}
                      onClick={() => { setPlanDays(days); setPlanReady(false); }}
                      key={days}
                    >
                      <strong>{days}</strong> days
                    </button>
                  ))}
                </div>
              </fieldset>

              <button className="button button--lime plan-submit" type="button" onClick={() => setPlanReady(true)}>
                Reveal My Plan <span className="button-icon" aria-hidden="true">↗</span>
              </button>

              <div className={`plan-result${planReady ? " is-visible" : ""}`} aria-live="polite">
                <div>
                  <small>Your FitFlow match</small>
                  <h3>{recommendedPlan.name}</h3>
                  <p>{planDays} sessions/week · {recommendedPlan.focus}</p>
                </div>
                <span>{recommendedPlan.accent}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="week-tracker" id="my-week" aria-labelledby="week-title">
          <div className="container week-shell">
            <div className="week-heading">
              <div>
                <p className="eyebrow eyebrow--light"><span /> Your weekly rhythm</p>
                <h2 id="week-title">Show up. Check in.<br /><em>Keep your week visible.</em></h2>
              </div>
              <div className="week-progress" aria-live="polite">
                <div><span>{completedSessions.length} of {weeklySessions.length} complete</span><strong>{weeklyProgress}%</strong></div>
                <div className="progress-track" aria-hidden="true"><span style={{ width: `${weeklyProgress}%` }} /></div>
                {completedSessions.length > 0 && <button type="button" onClick={resetWeek}>Reset week</button>}
              </div>
            </div>

            <div className="session-grid" aria-label="This week's workout sessions">
              {weeklySessions.map((session) => {
                const isComplete = completedSessions.includes(session.id);
                return (
                  <article className={`session-card${isComplete ? " is-complete" : ""}`} key={session.id}>
                    <div className="session-top"><span>{session.day}</span><span aria-hidden="true">{session.icon}</span></div>
                    <p>{session.type} · {session.duration}</p>
                    <h3>{session.title}</h3>
                    <button
                      type="button"
                      aria-pressed={isComplete}
                      onClick={() => toggleSession(session.id)}
                      disabled={!trackerReady}
                    >
                      <span aria-hidden="true">{isComplete ? "✓" : "+"}</span>
                      {isComplete ? "Completed" : "Mark complete"}
                    </button>
                  </article>
                );
              })}
            </div>
            <p className="week-note">Progress is stored privately on this device.</p>
          </div>
        </section>

        <section className="timer-section" id="flow-timer" aria-labelledby="timer-title">
          <div className="container timer-grid">
            <div className="timer-copy">
              <p className="eyebrow"><span /> Built-in training tool</p>
              <h2 id="timer-title">Own every interval.<br /><em>Stay in your flow.</em></h2>
              <p>Choose a preset, start the timer, and follow alternating work and recovery phases.</p>
              <div className="timer-presets" aria-label="Timer presets">
                {timerPresets.map((preset, index) => (
                  <button
                    className={timerPresetIndex === index ? "is-active" : ""}
                    type="button"
                    aria-pressed={timerPresetIndex === index}
                    onClick={() => selectTimerPreset(index)}
                    key={preset.label}
                  >
                    <strong>{preset.label}</strong><span>{preset.detail} · {preset.rounds} rounds</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="timer-console" aria-label="Interval timer">
              <div className="timer-console-top"><span>{activeTimerPreset.label}</span><span>Round {timerRound}/{activeTimerPreset.rounds}</span></div>
              <div className="timer-dial" style={{ background: `conic-gradient(var(--lime) ${timerProgress}%, rgba(255,255,255,0.08) 0)` }}>
                <div>
                  <small>{timerPhase === "done" ? "Session" : timerPhase}</small>
                  <strong aria-live="polite">{timerPhase === "done" ? "DONE" : formattedTimer}</strong>
                  <span>{timerPhase === "work" ? "Keep moving" : timerPhase === "rest" ? "Breathe and reset" : "Session complete"}</span>
                </div>
              </div>
              <div className="timer-actions">
                <button className="timer-main" type="button" onClick={toggleTimer}>
                  {timerRunning ? "Pause" : timerPhase === "done" ? "Restart" : "Start"}
                  <span aria-hidden="true">{timerRunning ? "Ⅱ" : "▶"}</span>
                </button>
                <button type="button" onClick={resetTimer}>Reset</button>
              </div>
            </div>
          </div>
        </section>

        <section className="section faq" id="faq" aria-labelledby="faq-title">
          <div className="container faq-shell">
            <div className="faq-heading">
              <p className="eyebrow"><span /> Good to know</p>
              <h2 id="faq-title">Questions,<br /><em>answered clearly.</em></h2>
              <p>Product behavior and scope, without unsupported marketing claims.</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.question} open={index === 0}>
                  <summary><span>0{index + 1}</span>{faq.question}<i aria-hidden="true">+</i></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section" id="get-started" aria-labelledby="cta-title">
          <div className="container cta-inner">
            <div className="cta-copy">
              <p className="eyebrow eyebrow--light"><span /> Try the product flow</p>
              <h2 id="cta-title">Ready to Build<br />Your Training Week?</h2>
              <p>Choose a goal, generate a plan, run a guided interval, and keep completion state locally.</p>
            </div>
            <a className="button button--lime button--large" href="#plan-builder">
              Build My Plan <span className="button-icon" aria-hidden="true">↗</span>
            </a>
            <div className="cta-orbit" aria-hidden="true"><span /></div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="contact">
        <div className="container footer-grid">
          <div className="footer-brand">
            <a className="brand brand--footer" href="#home" aria-label="FitFlow home">
              <span className="brand-mark" aria-hidden="true"><span /><span /></span><span>FitFlow</span>
            </a>
            <p>A local-first fitness PWA focused on planning, guided intervals, and weekly progress.</p>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <div>
              <h2>Explore</h2><a href="#programs">Programs</a><a href="#my-week">My Week</a><a href="#flow-timer">Timer</a>
            </div>
            <div>
              <h2>Project</h2><a href="https://github.com/rahman-997/fitflow-gym" target="_blank" rel="noreferrer">GitHub</a><a href="https://www.linkedin.com/in/abdulrahman-hajjar-5430281a1" target="_blank" rel="noreferrer">LinkedIn</a><a href="#faq">FAQ</a>
            </div>
          </nav>

          <div className="footer-social">
            <h2>Built by Abdulrahman Hajar</h2>
            <div>
              <a href="https://github.com/rahman-997" target="_blank" rel="noreferrer" aria-label="Abdulrahman Hajar on GitHub">gh</a>
              <a href="https://www.linkedin.com/in/abdulrahman-hajjar-5430281a1" target="_blank" rel="noreferrer" aria-label="Abdulrahman Hajar on LinkedIn">in</a>
            </div>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>© 2026 FitFlow · Concept project by Abdulrahman Hajar.</p>
          <div><a href="#programs">Programs</a><a href="#flow-timer">Timer</a></div>
          <p>Move with purpose.</p>
        </div>
      </footer>
    </>
  );
}
