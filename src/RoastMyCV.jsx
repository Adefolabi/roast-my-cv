import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { submitRoast, fetchShareCard } from "./api";

/* ------------------------------------------------------------------ */
/*  STATIC CONFIG                                                      */
/* ------------------------------------------------------------------ */

// ids must match the persona keys in backend/src/lib/buildPrompt.js
const VOICES = [
	{
		id: "savage",
		name: "Savage",
		tagline: "No mercy. No survivors.",
	},
	{
		id: "dryBritishRecruiter",
		name: "Dry British Recruiter",
		tagline: "Devastating politeness.",
	},
	{
		id: "drillSergeant",
		name: "Drill Sergeant",
		tagline: "DROP AND GIVE ME BULLET POINTS.",
	},
	{
		id: "pidgin",
		name: "pidgin",
		tagline: "Nigerian pidgin..You go muzz",
	},
];

// display label + fallback emoji per category returned by the backend
// (backend/src/lib/categories.js is the source of truth for the keys)
const CATEGORY_META = {
  vague_metrics: { label: "Vague Metrics" },
  buzzword_soup: { label: "Buzzword Soup" },
  wall_of_text: { label: "Wall of Text" },
  passive_voice: { label: "Passive Voice"},
  no_summary: { label: "No Summary" },
  generic_bullet: { label: "Generic Bullet" },
  generic: { label: "General" },
};

function getCategoryMeta(category) {
  return CATEGORY_META[category] || CATEGORY_META.generic;
}

const LOADING_LINES = [
  "Reading between the bullet points...",
  "Counting buzzwords... found 47 so far...",
  "Judging your font choices...",
  "Cross-referencing 'team player' with reality...",
  "Measuring the gap between 2019 and 2021...",
  "Asking 'proficient in Excel' to prove it...",
  "Consulting the Roast Council...",
];

const LINE_CYCLE_MS = 1500; // how often the status line rotates

/* ------------------------------------------------------------------ */
/*  SHARED STYLE PRIMITIVES                                            */
/* ------------------------------------------------------------------ */

const HARD_SHADOW =
  "shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0 active:translate-y-0 transition-all duration-150";

/* ------------------------------------------------------------------ */
/*  APP                                                                */
/* ------------------------------------------------------------------ */

export default function RoastMyCV() {
  const [screen, setScreen] = useState("upload"); // 'upload' | 'loading' | 'results' | 'error'
  const [file, setFile] = useState(null);
  const [voice, setVoice] = useState(null);
  const [findings, setFindings] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const startRoast = async () => {
    setScreen("loading");
    try {
      const data = await submitRoast(file, voice.id);
      setFindings(data.findings ?? []);
      setScreen("results");
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong roasting your CV.");
      setScreen("error");
    }
  };

  const reset = () => {
    setFile(null);
    setVoice(null);
    setFindings([]);
    setErrorMessage("");
    setScreen("upload");
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-black font-sans antialiased overflow-x-hidden selection:bg-orange-400 selection:text-black">
      {/* single subtle accent shape, kept flat/quiet not chaotic */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-200/50 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-10 lg:px-16 py-8 sm:py-14">
        {/* brand bar */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">🔥</span>
            <span className="font-black uppercase tracking-wide text-sm">
              Roast My CV
            </span>
          </div>
          <span className="hidden sm:inline-block border-2 border-black rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-white">
            No Sign-up Needed
          </span>
        </div>

        <AnimatePresence mode="wait">
          {screen === "upload" && (
            <UploadScreen
              key="upload"
              file={file}
              setFile={setFile}
              voice={voice}
              setVoice={setVoice}
              onRoast={startRoast}
            />
          )}
          {screen === "loading" && <LoadingScreen key="loading" />}
          {screen === "results" && (
            <ResultsScreen
              key="results"
              fileName={file?.name ?? "your_cv.pdf"}
              voice={voice}
              findings={findings}
              onReset={reset}
            />
          )}
          {screen === "error" && (
            <ErrorScreen key="error" message={errorMessage} onReset={reset} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREEN 1 — LANDING / UPLOAD                                        */
/* ------------------------------------------------------------------ */

function UploadScreen({ file, setFile, voice, setVoice, onRoast }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const acceptFile = useCallback(
    (f) => {
      if (!f) return;
      // PDF only for now — mock check on extension/type
      if (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")) {
        setFile(f);
      }
    },
    [setFile]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const ready = Boolean(file && voice);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Headline */}
      <header className="mb-10">
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tight">
          <span className="block">GET YOUR CV</span>
          <span className="inline-block bg-orange-400 text-black px-3 py-1 -rotate-1 mt-2 rounded-md">
            ROASTED.
          </span>
        </h1>
        <p className="mt-4 text-neutral-600 text-base sm:text-lg font-medium max-w-lg">
          Upload your resume. Get destroyed. Get better.{" "}
          <span className="text-neutral-400">(In that order.)</span>
        </p>
      </header>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-10 items-stretch">
        {/* Upload dropzone */}
        <section aria-label="Upload your CV">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">
            Step 1 — Your CV
          </p>
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              "cursor-pointer rounded-2xl border-4 p-8 lg:p-12 text-center transition-colors duration-200 h-full min-h-[280px] flex flex-col items-center justify-center bg-white",
              dragging
                ? "border-orange-500 bg-orange-50"
                : file
                ? "border-black"
                : "border-black hover:bg-neutral-50",
            ].join(" ")}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            {file ? (
              <div>
                <div className="mx-auto mb-3 h-12 w-12 rounded-xl border-2 border-black bg-emerald-100 flex items-center justify-center text-2xl">
                  ✅
                </div>
                <p className="font-bold break-all">{file.name}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Locked and loaded. Click to swap it out.
                </p>
              </div>
            ) : (
              <div>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="mx-auto mb-3 h-12 w-12 rounded-xl border-2 border-black bg-orange-100 flex items-center justify-center text-2xl"
                  aria-hidden="true"
                >
                  📎
                </motion.div>
                <p className="font-bold">
                  Drop your CV here
                </p>
                <p className="text-neutral-500 text-sm">or click to browse</p>
                <p className="text-xs text-neutral-400 mt-3">
                  PDF only. We promise to only judge the contents. And the font. And the margins.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Voice picker + CTA */}
        <section aria-label="Pick your roaster" className="flex flex-col h-full">
          <p className="text-xs font-black uppercase tracking-widest text-neutral-500 mb-2">
            Step 2 — Pick Your Poison
          </p>
          <div className="grid grid-cols-2 gap-3 flex-1">
            {VOICES.map((v, i) => {
              const selected = voice?.id === v.id;
              return (
                <motion.button
                  key={v.id}
                  type="button"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.3,
                    ease: "easeInOut",
                    delay: i * 0.15,
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setVoice(v)}
                  aria-pressed={selected}
                  className={[
                    "rounded-xl border-2 border-black p-4 lg:p-5 text-left transition-colors duration-150",
                    selected ? "bg-black text-white" : "bg-white hover:bg-neutral-50",
                  ].join(" ")}
                >
                  <div className="font-bold text-sm leading-tight">{v.name}</div>
                  <div
                    className={[
                      "text-xs mt-1 leading-snug",
                      selected ? "text-white/70" : "text-neutral-500",
                    ].join(" ")}
                  >
                    {v.tagline}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-5">
            <motion.button
              type="button"
              disabled={!ready}
              onClick={onRoast}
              whileTap={ready ? { scale: 0.98 } : {}}
              className={[
                "w-full px-6 py-5 rounded-xl text-xl font-black tracking-tight border-2",
                ready
                  ? `bg-orange-500 hover:bg-orange-400 border-black text-black ${HARD_SHADOW}`
                  : "bg-neutral-100 border-neutral-300 text-neutral-400 cursor-not-allowed",
              ].join(" ")}
            >
              {ready ? "Roast Me →" : "Roast Me"}
            </motion.button>
            <p className="mt-2 text-xs text-neutral-400 text-center">
              {ready
                ? "No refunds on emotional damage."
                : "Upload a CV and pick a roaster to unlock the pain."}
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREEN 2 — LOADING / "ROASTING..."                                 */
/* ------------------------------------------------------------------ */

function LoadingScreen() {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const cycle = setInterval(
      () => setLineIndex((i) => (i + 1) % LOADING_LINES.length),
      LINE_CYCLE_MS
    );
    return () => clearInterval(cycle);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center min-h-[55vh] rounded-2xl border-2 border-black bg-white p-10"
    >
      {/* spinning flame */}
      <motion.div
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
        className="h-16 w-16 rounded-xl border-2 border-black bg-orange-100 flex items-center justify-center text-4xl mb-8"
        aria-hidden="true"
      >
        🔥
      </motion.div>

      <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
        Roasting in progress
      </h2>

      {/* rotating status line */}
      <div className="h-8 mt-2" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="text-neutral-500 font-medium"
          >
            {LOADING_LINES[lineIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* indeterminate progress bar — real request duration varies */}
      <div className="mt-10 w-full max-w-sm h-3 rounded-full bg-neutral-100 border-2 border-black overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "250%" }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          className="h-full w-2/5 bg-orange-500 rounded-full"
        />
      </div>
      <p className="mt-3 text-xs text-neutral-400 font-medium">
        This hurts us more than it hurts you. (It doesn't.)
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREEN 3 — RESULTS                                                 */
/* ------------------------------------------------------------------ */

function ResultsScreen({ fileName, voice, findings, onReset }) {
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");

  const handleShare = async () => {
    setSharing(true);
    setShareError("");
    try {
      const blob = await fetchShareCard(findings, voice?.id);
      const file = new File([blob], "roast-card.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My CV Roast",
          text: "I got my CV roasted 🔥",
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "roast-card.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      // user cancelling the native share sheet isn't an error
      if (err?.name !== "AbortError") {
        setShareError(err.message || "Couldn't generate your share card.");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[0.92]">
          <span className="block">THE VERDICT</span>
          <span className="inline-block bg-orange-400 text-black px-3 py-1 -rotate-1 mt-2 rounded-md">
            IS IN.
          </span>
        </h1>
        <p className="mt-4 text-sm text-neutral-500 font-medium break-all">
          <span className="text-neutral-700">{fileName}</span> — roasted by{" "}
          <span className="text-black font-bold">
            {voice?.emoji} {voice?.name ?? "the council"}
          </span>
        </p>

        {/* Share button */}
        <motion.button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          whileTap={sharing ? {} : { scale: 0.97 }}
          className={[
            "mt-5 px-5 py-2.5 rounded-full border-2 border-black font-bold text-sm",
            sharing ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : "bg-white hover:bg-neutral-50",
          ].join(" ")}
        >
          {sharing ? "Generating…" : "Share Your Roast 📤"}
        </motion.button>
        {shareError && (
          <p className="mt-2 text-xs text-red-600 font-medium">{shareError}</p>
        )}
      </header>

      {/* Finding cards — staggered entrance */}
      <motion.ul
        className="grid gap-5 lg:grid-cols-2 list-none p-0"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
        }}
      >
        {findings.map((f, i) => {
          const meta = getCategoryMeta(f.category);
          return (
            <motion.li
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.97 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 120, damping: 16 },
                },
              }}
              className="rounded-2xl border-2 border-black bg-white overflow-hidden flex flex-col"
            >
              {/* Roast half */}
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="min-w-0">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-black bg-orange-400 border-2 border-black rounded-full px-2.5 py-0.5 mb-2">
                      {meta.label}
                    </span>
                    <p className="text-lg sm:text-xl font-extrabold leading-snug tracking-tight">
                      “{f.roastLine}”
                    </p>
                  </div>
                </div>
              </div>

              {/* Serious-feedback half — calmer tone */}
              <div className="bg-neutral-50 border-t-2 border-black px-5 sm:px-6 py-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1.5">
                  💡 Okay but actually
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed">{f.feedback}</p>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* Footer actions */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <motion.button
          type="button"
          onClick={onReset}
          whileTap={{ scale: 0.98 }}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 border-2 border-black font-black ${HARD_SHADOW}`}
        >
          Roast Again 🔁
        </motion.button>
        <motion.button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          whileTap={sharing ? {} : { scale: 0.98 }}
          className={[
            "w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-black font-bold",
            sharing ? "bg-neutral-100 text-neutral-400 cursor-not-allowed" : "bg-white hover:bg-neutral-50",
          ].join(" ")}
        >
          {sharing ? "Generating…" : "Share Your Roast 📤"}
        </motion.button>
      </div>

      <p className="mt-8 text-center text-xs text-neutral-400">
        Roasts are for entertainment. The feedback, unfortunately, is real.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  SCREEN 4 — ERROR                                                   */
/* ------------------------------------------------------------------ */

function ErrorScreen({ message, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center text-center min-h-[55vh] rounded-2xl border-2 border-black bg-white p-10"
    >
      <div
        className="h-16 w-16 rounded-xl border-2 border-black bg-red-100 flex items-center justify-center text-4xl mb-8"
        aria-hidden="true"
      >
        💥
      </div>
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
        The roast backfired
      </h2>
      <p className="mt-2 text-neutral-500 font-medium max-w-sm">{message}</p>
      <motion.button
        type="button"
        onClick={onReset}
        whileTap={{ scale: 0.98 }}
        className={`mt-8 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 border-2 border-black font-black ${HARD_SHADOW}`}
      >
        Try Again
      </motion.button>
    </motion.div>
  );
}
