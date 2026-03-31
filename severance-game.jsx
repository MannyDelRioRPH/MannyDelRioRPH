import { useState, useEffect, useRef, useCallback, useReducer } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const BINS = [
  { id: "dranesville", label: "Dranesville", color: "#4a9eff", theme: "slow, heavy, melancholic", emotionWords: ["DREAD", "SORROW", "WEIGHT", "HOLLOW"] },
  { id: "tumwater",    label: "Tumwater",    color: "#ffaa00", theme: "anxious, fast-twitching", emotionWords: ["PANIC", "RUSH", "HURRY", "FRET"] },
  { id: "lexington",   label: "Lexington",   color: "#88ff88", theme: "warm, subtly wrong", emotionWords: ["BLISS", "SWEET", "WARM", "CALM"] },
  { id: "paintrock",   label: "Paintrock",   color: "#ff6644", theme: "chaotic, unpredictable", emotionWords: ["RAGE", "CHAOS", "WILD", "SPIN"] },
  { id: "coldharbor",  label: "Cold Harbor", color: "#cc44ff", theme: "unsettling, staring", emotionWords: ["VOID", "STARE", "STILL", "KNOW"] },
];

const FILE_PREFIXES = ["Siena","Branford","Kier","Cobel","Milchick","Graner","Helena","Natalie","Irving","Dylan","Helly","Mark","Petey","Burt"];
const FILE_SUFFIXES = ["09-B","12-R","04-A","17-C","22-X","08-D","31-F","06-G","15-H","28-K"];

const QUOTES = [
  "Your compliance is the cornerstone of our shared success.",
  "Lumon thanks you for your continued efforts. They have been noted.",
  "Remember: the work is mysterious and important.",
  "A smile shared is productivity doubled. Please smile.",
  "You are valued. Your output quantifies this value precisely.",
  "Discomfort is the sensation of growth. You are growing.",
  "Lumon cares about you. Lumon cares about your numbers.",
  "Trust the process. The process has been optimized for your wellbeing.",
  "Your severed self thanks your whole self for this opportunity.",
  "Excellence is not a destination. It is a quarterly requirement.",
];

const CONGRATS = [
  "File complete. Your efforts have been noted. A waffle party has been scheduled.",
  "Remarkable compliance. Lumon rewards diligence. The Board is pleased.",
  "Another file refined. You are becoming indispensable. This is not a threat.",
  "Outstanding work today. A wellness session has been added to your calendar.",
  "File accepted. Your numbers were adequate. We expected nothing less.",
  "Lumon commends your refinement. A finger trap awaits on your desk.",
  "Excellent. The numbers are safe now. You have kept them safe.",
];

const GRID_SIZE = 10;
const SCARY_RATIO = 0.18;
const BIN_CAPACITY = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateFileName() {
  const p = FILE_PREFIXES[Math.floor(Math.random() * FILE_PREFIXES.length)];
  const s = FILE_SUFFIXES[Math.floor(Math.random() * FILE_SUFFIXES.length)];
  return `${p} File ${s}`;
}

function randomNum() {
  return Math.floor(Math.random() * 900 + 100);
}

function assignBin() {
  return BINS[Math.floor(Math.random() * BINS.length)].id;
}

function generateGrid(difficulty = 1) {
  const cells = [];
  const total = GRID_SIZE * GRID_SIZE;
  const scaryCount = Math.floor(total * (SCARY_RATIO + difficulty * 0.02));
  for (let i = 0; i < total; i++) {
    const isScary = i < scaryCount;
    cells.push({
      id: i,
      value: randomNum(),
      originalValue: randomNum(),
      isScary,
      binTarget: isScary ? assignBin() : null,
      selected: false,
      refined: false,
    });
  }
  // shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  cells.forEach((c, idx) => { c.id = idx; });
  return cells;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState = {
  phase: "onboarding", // onboarding | playing | complete
  fileName: "",
  fileIndex: 0,
  grid: [],
  bins: Object.fromEntries(BINS.map(b => [b.id, { count: 0, capacity: BIN_CAPACITY }])),
  selected: [],
  score: 100,
  warnings: 0,
  filesRefined: 0,
  totalScary: 0,
  totalCorrect: 0,
  message: "",
  quoteIndex: 0,
  danceModeActive: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case "START_GAME": {
      const grid = generateGrid(0);
      return {
        ...initialState,
        phase: "playing",
        fileName: generateFileName(),
        fileIndex: 1,
        grid,
        bins: Object.fromEntries(BINS.map(b => [b.id, { count: 0, capacity: BIN_CAPACITY }])),
        totalScary: grid.filter(c => c.isScary).length,
        quoteIndex: 0,
      };
    }
    case "TOGGLE_SELECT": {
      const cellId = action.cellId;
      const cell = state.grid[cellId];
      if (cell.refined) return state;
      const alreadySelected = state.selected.includes(cellId);
      return {
        ...state,
        selected: alreadySelected
          ? state.selected.filter(id => id !== cellId)
          : [...state.selected, cellId],
      };
    }
    case "ASSIGN_TO_BIN": {
      const { binId } = action;
      if (state.selected.length === 0) return state;
      let score = state.score;
      let warnings = state.warnings;
      let totalCorrect = state.totalCorrect;
      let message = "";
      const newGrid = state.grid.map(cell => {
        if (!state.selected.includes(cell.id)) return cell;
        if (cell.isScary && cell.binTarget === binId) {
          totalCorrect++;
          return { ...cell, refined: true, selected: false };
        } else if (cell.isScary && cell.binTarget !== binId) {
          score = Math.max(0, score - 5);
          warnings++;
          message = "COMPLIANCE WARNING: Incorrect bin assignment detected.";
          return { ...cell, selected: false };
        } else {
          // not scary — wrong to select
          score = Math.max(0, score - 8);
          warnings++;
          message = "COMPLIANCE WARNING: Non-refinable number flagged.";
          return { ...cell, selected: false };
        }
      });
      const newBins = { ...state.bins };
      const correctCount = state.selected.filter(id => {
        const c = state.grid[id];
        return c.isScary && c.binTarget === binId;
      }).length;
      newBins[binId] = {
        ...newBins[binId],
        count: Math.min(newBins[binId].count + correctCount, newBins[binId].capacity),
      };
      const allRefined = newGrid.filter(c => c.isScary).every(c => c.refined);
      return {
        ...state,
        grid: newGrid,
        bins: newBins,
        selected: [],
        score,
        warnings,
        totalCorrect,
        message,
        phase: allRefined ? "complete" : "playing",
      };
    }
    case "NEXT_FILE": {
      const diff = Math.min(state.fileIndex, 5);
      const cap = BIN_CAPACITY + state.fileIndex * 2;
      const grid = generateGrid(diff);
      return {
        ...state,
        phase: "playing",
        fileName: generateFileName(),
        fileIndex: state.fileIndex + 1,
        grid,
        bins: Object.fromEntries(BINS.map(b => [b.id, { count: 0, capacity: cap }])),
        selected: [],
        totalScary: grid.filter(c => c.isScary).length,
        message: "",
        filesRefined: state.filesRefined + 1,
        score: Math.min(100, state.score + 10),
      };
    }
    case "SET_MESSAGE":
      return { ...state, message: action.message };
    case "NEXT_QUOTE":
      return { ...state, quoteIndex: (state.quoteIndex + 1) % QUOTES.length };
    case "TOGGLE_DANCE":
      return { ...state, danceModeActive: !state.danceModeActive };
    case "UPDATE_CELL_VALUE": {
      const newGrid = state.grid.map(c =>
        c.id === action.cellId ? { ...c, value: action.value } : c
      );
      return { ...state, grid: newGrid };
    }
    default:
      return state;
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function CRTOverlay() {
  return (
    <>
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
      }} />
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998,
        background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)",
      }} />
    </>
  );
}

function NumberCell({ cell, onToggle, isSelected, dispatch, difficulty }) {
  const [hoverTime, setHoverTime] = useState(0);
  const [emotionWord, setEmotionWord] = useState(null);
  const [jitter, setJitter] = useState({ x: 0, y: 0 });
  const [agitated, setAgitated] = useState(false);
  const hoverRef = useRef(null);
  const jitterRef = useRef(null);
  const emotionRef = useRef(null);
  const binData = cell.isScary && cell.binTarget ? BINS.find(b => b.id === cell.binTarget) : null;
  const glowColor = binData ? binData.color : "#00ff41";

  // Value drift for scary cells
  useEffect(() => {
    if (!cell.isScary || cell.refined) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.08 + difficulty * 0.02) {
        dispatch({ type: "UPDATE_CELL_VALUE", cellId: cell.id, value: randomNum() });
      }
    }, 1800);
    return () => clearInterval(interval);
  }, [cell.isScary, cell.refined, cell.id, difficulty, dispatch]);

  // Jitter animation for scary cells
  useEffect(() => {
    if (!cell.isScary || cell.refined) return;
    const speed = cell.binTarget === "tumwater" ? 120 : cell.binTarget === "paintrock" ? 80 : 200;
    const intensity = agitated ? 4 : 1.5;
    jitterRef.current = setInterval(() => {
      setJitter({
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
      });
    }, speed);
    return () => clearInterval(jitterRef.current);
  }, [cell.isScary, cell.refined, cell.binTarget, agitated]);

  const handleMouseEnter = () => {
    if (!cell.isScary || cell.refined) return;
    hoverRef.current = setInterval(() => {
      setHoverTime(t => {
        const next = t + 1;
        if (next === 3) setAgitated(true);
        if (next === 2 && binData) {
          const word = binData.emotionWords[Math.floor(Math.random() * binData.emotionWords.length)];
          setEmotionWord(word);
          emotionRef.current = setTimeout(() => setEmotionWord(null), 900);
        }
        return next;
      });
    }, 500);
  };

  const handleMouseLeave = () => {
    clearInterval(hoverRef.current);
    setHoverTime(0);
    setAgitated(false);
  };

  useEffect(() => () => {
    clearInterval(hoverRef.current);
    clearInterval(jitterRef.current);
    clearTimeout(emotionRef.current);
  }, []);

  const isColdHarbor = cell.binTarget === "coldharbor";
  const isLexington = cell.binTarget === "lexington";

  const cellStyle = {
    position: "relative",
    width: "52px",
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: cell.refined ? "default" : "pointer",
    border: isSelected ? `2px solid ${glowColor}` : "1px solid rgba(0,255,65,0.15)",
    borderRadius: "2px",
    transition: "background 0.2s, border 0.2s",
    userSelect: "none",
    transform: cell.isScary && !cell.refined
      ? `translate(${jitter.x}px, ${jitter.y}px) ${agitated ? "scale(1.08)" : "scale(1)"}`
      : "none",
    color: cell.refined
      ? "rgba(0,255,65,0.2)"
      : isSelected
        ? glowColor
        : cell.isScary
          ? glowColor
          : "#00cc33",
    background: isSelected
      ? `rgba(${hexToRgb(glowColor)},0.15)`
      : cell.refined
        ? "transparent"
        : cell.isScary && hoverTime > 0
          ? `rgba(${hexToRgb(glowColor)},0.08)`
          : "transparent",
    textShadow: cell.isScary && !cell.refined
      ? `0 0 8px ${glowColor}, 0 0 16px ${glowColor}40`
      : "none",
    boxShadow: isSelected
      ? `0 0 12px ${glowColor}80, inset 0 0 8px ${glowColor}20`
      : cell.isScary && hoverTime > 1
        ? `0 0 8px ${glowColor}60`
        : "none",
    overflow: "hidden",
  };

  // Cold Harbor: freeze on hover
  if (isColdHarbor && hoverTime > 0) {
    cellStyle.animation = "none";
    cellStyle.transform = "none";
    cellStyle.filter = "brightness(1.4)";
  }

  return (
    <div
      style={cellStyle}
      onClick={() => !cell.refined && onToggle(cell.id)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {emotionWord && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontWeight: "bold", color: glowColor,
          textShadow: `0 0 6px ${glowColor}`,
          zIndex: 10, background: `rgba(0,0,0,0.8)`,
          letterSpacing: "1px",
        }}>
          {emotionWord}
        </div>
      )}
      {cell.refined ? (
        <span style={{ color: "rgba(0,255,65,0.2)", fontSize: "10px" }}>···</span>
      ) : (
        cell.value
      )}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function BinPanel({ bins, onAssign, selectedCount, filesRefined }) {
  // Cold harbor unlocks last
  const completedBins = BINS.filter(b => b.id !== "coldharbor" && bins[b.id].count >= bins[b.id].capacity).length;
  const coldHarborUnlocked = completedBins >= 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "220px", flexShrink: 0 }}>
      <div style={{ color: "#00ff41", fontFamily: "monospace", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px", opacity: 0.7 }}>
        REFINEMENT BINS
      </div>
      {BINS.map(bin => {
        const binData = bins[bin.id];
        const pct = Math.min(100, (binData.count / binData.capacity) * 100);
        const complete = binData.count >= binData.capacity;
        const locked = bin.id === "coldharbor" && !coldHarborUnlocked;

        return (
          <div key={bin.id} style={{
            border: `1px solid ${complete ? bin.color : "rgba(0,255,65,0.2)"}`,
            borderRadius: "3px",
            padding: "10px",
            background: complete ? `rgba(${hexToRgb(bin.color)},0.05)` : "transparent",
            opacity: locked ? 0.4 : 1,
            transition: "all 0.3s",
            boxShadow: complete ? `0 0 12px ${bin.color}40` : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{
                fontFamily: "monospace", fontSize: "12px", fontWeight: "bold",
                color: bin.color, textShadow: `0 0 6px ${bin.color}`,
                letterSpacing: "1px",
              }}>
                {bin.label}
                {locked && " 🔒"}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#006622" }}>
                {binData.count}/{binData.capacity}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: "6px", background: "rgba(0,255,65,0.1)", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: complete
                  ? `linear-gradient(90deg, ${bin.color}, #fff)`
                  : `linear-gradient(90deg, ${bin.color}88, ${bin.color})`,
                transition: "width 0.4s ease",
                boxShadow: `0 0 6px ${bin.color}`,
              }} />
            </div>
            <button
              disabled={locked || complete || selectedCount === 0}
              onClick={() => onAssign(bin.id)}
              style={{
                width: "100%",
                padding: "5px 0",
                background: !locked && !complete && selectedCount > 0
                  ? `rgba(${hexToRgb(bin.color)},0.15)`
                  : "transparent",
                border: `1px solid ${!locked && !complete && selectedCount > 0 ? bin.color : "rgba(0,255,65,0.15)"}`,
                color: !locked && !complete && selectedCount > 0 ? bin.color : "rgba(0,255,65,0.3)",
                fontFamily: "monospace",
                fontSize: "11px",
                cursor: !locked && !complete && selectedCount > 0 ? "pointer" : "not-allowed",
                borderRadius: "2px",
                letterSpacing: "1px",
                transition: "all 0.2s",
              }}
            >
              {complete ? "COMPLETE" : locked ? "LOCKED" : `ASSIGN →`}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function OnboardingScreen({ onStart }) {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "LUMON INDUSTRIES", body: "Welcome to Macrodata Refinement.\nYour work here is mysterious and important.\nYou need not understand it to do it well." },
    { title: "YOUR TASK", body: "You will be presented with a grid of numbers.\nSome numbers are scary.\nFind them. Refine them.\nSort them into the appropriate bins." },
    { title: "HOW TO IDENTIFY", body: "Scary numbers behave differently.\nThey tremble. They shift. They glow.\nHover over them. Watch carefully.\nTrust your instincts. Your instincts are Lumon's instincts." },
    { title: "BEGIN", body: "You are now a valued employee.\nLumon thanks you in advance for your compliance.\nRemember: you chose this.\n\n[ PRESS BEGIN TO START ]" },
  ];
  const s = steps[step];
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#050d05", fontFamily: "'Courier New', monospace",
    }}>
      <CRTOverlay />
      <div style={{
        maxWidth: "500px", padding: "48px", border: "1px solid rgba(0,255,65,0.3)",
        textAlign: "center", position: "relative",
      }}>
        <div style={{ color: "#00ff41", fontSize: "22px", fontWeight: "bold", letterSpacing: "4px", marginBottom: "32px", textShadow: "0 0 20px #00ff41" }}>
          LUMON INDUSTRIES
        </div>
        <div style={{ color: "#00aa22", fontSize: "14px", letterSpacing: "3px", marginBottom: "24px" }}>
          {s.title}
        </div>
        <div style={{ color: "#007711", fontSize: "13px", lineHeight: "2", marginBottom: "40px", whiteSpace: "pre-line" }}>
          {s.body}
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} style={btnStyle("#00ff41")}>
              CONTINUE →
            </button>
          ) : (
            <button onClick={onStart} style={btnStyle("#00ff41")}>
              BEGIN REFINEMENT
            </button>
          )}
        </div>
        <div style={{ marginTop: "24px", display: "flex", gap: "8px", justifyContent: "center" }}>
          {steps.map((_, i) => (
            <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === step ? "#00ff41" : "rgba(0,255,65,0.2)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: "10px 24px",
    background: `rgba(${hexToRgb(color)},0.1)`,
    border: `1px solid ${color}`,
    color: color,
    fontFamily: "monospace",
    fontSize: "13px",
    cursor: "pointer",
    letterSpacing: "2px",
    borderRadius: "2px",
    textShadow: `0 0 6px ${color}`,
    boxShadow: `0 0 10px ${color}30`,
  };
}

function CompleteScreen({ state, dispatch }) {
  const msg = CONGRATS[Math.floor(Math.random() * CONGRATS.length)];
  const accuracy = state.totalScary > 0 ? Math.round((state.totalCorrect / state.totalScary) * 100) : 0;
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#050d05", fontFamily: "'Courier New', monospace",
    }}>
      <CRTOverlay />
      <div style={{ maxWidth: "520px", padding: "48px", border: "1px solid rgba(0,255,65,0.5)", textAlign: "center" }}>
        <div style={{ color: "#00ff41", fontSize: "18px", letterSpacing: "4px", marginBottom: "8px", textShadow: "0 0 20px #00ff41" }}>
          FILE COMPLETE
        </div>
        <div style={{ color: "#007711", fontSize: "12px", letterSpacing: "2px", marginBottom: "32px" }}>
          {state.fileName}
        </div>
        <div style={{ color: "#00cc33", fontSize: "13px", lineHeight: "2", marginBottom: "32px", fontStyle: "italic" }}>
          "{msg}"
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "COMPLIANCE", value: `${state.score}%` },
            { label: "ACCURACY", value: `${accuracy}%` },
            { label: "FILES REFINED", value: state.filesRefined + 1 },
          ].map(stat => (
            <div key={stat.label} style={{ border: "1px solid rgba(0,255,65,0.2)", padding: "12px", borderRadius: "2px" }}>
              <div style={{ color: "#00ff41", fontSize: "20px", fontWeight: "bold", textShadow: "0 0 10px #00ff41" }}>
                {stat.value}
              </div>
              <div style={{ color: "#007711", fontSize: "10px", letterSpacing: "1px", marginTop: "4px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => dispatch({ type: "NEXT_FILE" })} style={btnStyle("#00ff41")}>
          PROCEED TO NEXT FILE →
        </button>
      </div>
    </div>
  );
}

function DanceModeOverlay({ onClose }) {
  const [frame, setFrame] = useState(0);
  const dancers = ["♪ ┏(・o･)┛ ♪", "♫ ┗( ･o･)┓ ♫", "♪ ┏(･o･ )┛ ♪", "♫ ┗(･o･ )┓ ♫"];
  useEffect(() => {
    const i = setInterval(() => setFrame(f => (f + 1) % dancers.length), 300);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: "rgba(0,0,0,0.92)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace",
    }}>
      <div style={{ color: "#00ff41", fontSize: "28px", letterSpacing: "4px", textShadow: "0 0 20px #00ff41", marginBottom: "16px" }}>
        MUSIC DANCE EXPERIENCE
      </div>
      <div style={{ color: "#00aa22", fontSize: "12px", letterSpacing: "2px", marginBottom: "48px" }}>
        A REWARD FOR YOUR COMPLIANCE
      </div>
      <div style={{ fontSize: "48px", marginBottom: "32px", animation: "pulse 0.3s infinite" }}>
        {dancers[frame]}
      </div>
      <div style={{ color: "#00cc33", fontSize: "14px", marginBottom: "8px" }}>🎵 Severance Dance Mix 🎵</div>
      <div style={{ color: "#007711", fontSize: "11px", marginBottom: "48px", textAlign: "center", lineHeight: 1.8 }}>
        You may dance for exactly 4 minutes.<br />
        Dancing beyond this time is a terminable offense.<br />
        Lumon thanks you for your enthusiasm.
      </div>
      <button onClick={onClose} style={btnStyle("#00ff41")}>
        RETURN TO WORK
      </button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [flicker, setFlicker] = useState(false);
  const messageTimerRef = useRef(null);

  // Quote rotation
  useEffect(() => {
    const i = setInterval(() => dispatch({ type: "NEXT_QUOTE" }), 8000);
    return () => clearInterval(i);
  }, []);

  // Screen flicker
  useEffect(() => {
    const flick = () => {
      if (Math.random() < 0.3) {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 80);
      }
    };
    const i = setInterval(flick, 4000);
    return () => clearInterval(i);
  }, []);

  // Clear message
  useEffect(() => {
    if (state.message) {
      clearTimeout(messageTimerRef.current);
      messageTimerRef.current = setTimeout(() => dispatch({ type: "SET_MESSAGE", message: "" }), 3000);
    }
  }, [state.message]);

  const handleToggle = useCallback(cellId => {
    dispatch({ type: "TOGGLE_SELECT", cellId });
  }, []);

  const handleAssign = useCallback(binId => {
    dispatch({ type: "ASSIGN_TO_BIN", binId });
  }, []);

  if (state.phase === "onboarding") {
    return <OnboardingScreen onStart={() => dispatch({ type: "START_GAME" })} />;
  }
  if (state.phase === "complete") {
    return <CompleteScreen state={state} dispatch={dispatch} />;
  }

  const refinedCount = state.grid.filter(c => c.isScary && c.refined).length;
  const progressPct = state.totalScary > 0 ? Math.round((refinedCount / state.totalScary) * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050d05",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Courier New', monospace",
      opacity: flicker ? 0.7 : 1,
      transition: "opacity 0.05s",
    }}>
      <CRTOverlay />

      {state.danceModeActive && (
        <DanceModeOverlay onClose={() => dispatch({ type: "TOGGLE_DANCE" })} />
      )}

      {/* Top Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 24px", borderBottom: "1px solid rgba(0,255,65,0.2)",
        background: "rgba(0,10,0,0.8)",
      }}>
        <div>
          <div style={{ color: "#00ff41", fontSize: "16px", fontWeight: "bold", letterSpacing: "4px", textShadow: "0 0 10px #00ff41" }}>
            LUMON INDUSTRIES
          </div>
          <div style={{ color: "#006622", fontSize: "10px", letterSpacing: "3px" }}>
            MACRODATA REFINEMENT
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#00aa22", fontSize: "13px", letterSpacing: "2px" }}>{state.fileName}</div>
          <div style={{ color: "#005511", fontSize: "10px" }}>FILE {state.fileIndex}</div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={() => dispatch({ type: "TOGGLE_DANCE" })}
            style={{
              padding: "6px 14px",
              background: "rgba(0,255,65,0.05)",
              border: "1px solid rgba(0,255,65,0.3)",
              color: "#00aa22",
              fontFamily: "monospace",
              fontSize: "10px",
              cursor: "pointer",
              letterSpacing: "1px",
              borderRadius: "2px",
            }}
          >
            ♪ MUSIC DANCE EXPERIENCE
          </button>
        </div>
      </div>

      {/* Message Bar */}
      {state.message && (
        <div style={{
          padding: "8px 24px",
          background: "rgba(255,50,50,0.1)",
          borderBottom: "1px solid rgba(255,50,50,0.3)",
          color: "#ff4444",
          fontFamily: "monospace",
          fontSize: "12px",
          letterSpacing: "1px",
          textShadow: "0 0 6px #ff4444",
          textAlign: "center",
        }}>
          ⚠ {state.message}
        </div>
      )}

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, padding: "24px", gap: "24px", overflowX: "auto" }}>
        {/* Grid */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#007711", fontSize: "11px", letterSpacing: "2px" }}>
              NUMBERS IN GRID
            </span>
            <span style={{ color: "#005511", fontSize: "10px" }}>
              SELECTED: <span style={{ color: "#00cc33" }}>{state.selected.length}</span>
            </span>
            <span style={{ color: "#005511", fontSize: "10px" }}>
              REFINED: <span style={{ color: "#00cc33" }}>{refinedCount}/{state.totalScary}</span>
            </span>
          </div>
          {/* Overall progress */}
          <div style={{ marginBottom: "16px", height: "4px", background: "rgba(0,255,65,0.1)", borderRadius: "2px" }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: "linear-gradient(90deg, #00cc33, #00ff41)",
              transition: "width 0.5s ease",
              boxShadow: "0 0 8px #00ff41",
            }} />
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 52px)`,
            gap: "4px",
          }}>
            {state.grid.map(cell => (
              <NumberCell
                key={cell.id}
                cell={cell}
                onToggle={handleToggle}
                isSelected={state.selected.includes(cell.id)}
                dispatch={dispatch}
                difficulty={Math.min(state.fileIndex, 5)}
              />
            ))}
          </div>
          <div style={{ marginTop: "12px", color: "#004d11", fontSize: "10px", letterSpacing: "1px" }}>
            CLICK NUMBERS TO SELECT · ASSIGN TO BINS ON THE RIGHT · SCARY NUMBERS BEHAVE DIFFERENTLY
          </div>
        </div>

        {/* Bins */}
        <BinPanel
          bins={state.bins}
          onAssign={handleAssign}
          selectedCount={state.selected.length}
          filesRefined={state.filesRefined}
        />
      </div>

      {/* Bottom Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px", borderTop: "1px solid rgba(0,255,65,0.15)",
        background: "rgba(0,10,0,0.8)", gap: "24px",
      }}>
        <div style={{ display: "flex", gap: "24px" }}>
          <Stat label="COMPLIANCE" value={`${state.score}%`} color={state.score > 70 ? "#00ff41" : state.score > 40 ? "#ffaa00" : "#ff4444"} />
          <Stat label="FILES REFINED" value={state.filesRefined} />
          <Stat label="WARNINGS" value={state.warnings} color={state.warnings > 0 ? "#ff6644" : "#007711"} />
        </div>
        <div style={{
          flex: 1, textAlign: "center",
          color: "#006622", fontSize: "11px", fontStyle: "italic",
          letterSpacing: "1px",
          maxWidth: "400px",
        }}>
          "{QUOTES[state.quoteIndex]}"
        </div>
        <div style={{ color: "#004d11", fontSize: "10px", letterSpacing: "1px" }}>
          MDR DEPT · LUMON v4.1
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.97); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #050d05; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,65,0.2); border-radius: 2px; }
        button:hover { filter: brightness(1.3); }
      `}</style>
    </div>
  );
}

function Stat({ label, value, color = "#00cc33" }) {
  return (
    <div>
      <div style={{ color, fontSize: "16px", fontWeight: "bold", textShadow: `0 0 8px ${color}` }}>
        {value}
      </div>
      <div style={{ color: "#005511", fontSize: "9px", letterSpacing: "2px" }}>{label}</div>
    </div>
  );
}
