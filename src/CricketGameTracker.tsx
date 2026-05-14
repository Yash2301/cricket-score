import React, { useState, useEffect, useRef } from "react";
import "./CricketGameTracker.css";
import logo from "../logo.png";
import ConfirmDialog from "./components/ConfirmDialog";
import { BoundaryIcon, WicketIcon } from "./components/CricketIcons";
import BoundaryAnimation from "./components/BoundaryAnimation";
import { playBoundaryAudio } from "./audioPlayer";

interface Ball {
  runs: number;
  isWicket: boolean;
  isRunOut?: boolean;
  extras?: {
    type: "wide" | "noBall" | "byes" | "legByes";
    runs: number;
  };
  numberOfBall: number;
  numberOfOver: number;
}

interface Score {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  ballHistory: Ball[];
}

interface InningsLog {
  teamName: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  timestamp: number;
}

interface GameConfig {
  team1Name: string;
  team2Name: string;
  maxOvers: number;
}

interface InningsSummary {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
}

type Phase = "setup" | "innings1" | "innings2" | "result";

const speak = (text: string) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
};

const fmt = (overs: number, balls: number) => `${overs}.${balls}`;

// ── Setup Screen ───────────────────────────────────────────────────────────────

const OVERS_PRESETS = [6, 8, 10, 12, 15];

const SetupScreen: React.FC<{ onStart: (config: GameConfig) => void }> = ({ onStart }) => {
  const [team1Name, setTeam1Name] = useState("Team 1");
  const [team2Name, setTeam2Name] = useState("Team 2");
  const [maxOvers, setMaxOvers] = useState(8);
  const [useCustom, setUseCustom] = useState(false);
  const [customOvers, setCustomOvers] = useState("");

  const handleStart = () => {
    const overs = useCustom ? Math.max(1, parseInt(customOvers) || 10) : maxOvers;
    onStart({
      team1Name: team1Name.trim() || "Team 1",
      team2Name: team2Name.trim() || "Team 2",
      maxOvers: overs,
    });
  };

  return (
    <div className="setup-screen">
      <img src={logo} alt="Logo" className="setup-logo" />
      <h1 className="setup-title">Cricket Score Tracker</h1>

      <div className="setup-card">
        <h2 className="setup-card-title">New Match</h2>

        <div className="setup-field">
          <label>Team 1 — Batting First</label>
          <input
            type="text"
            value={team1Name}
            onChange={(e) => setTeam1Name(e.target.value)}
            placeholder="Team 1"
          />
        </div>

        <div className="setup-field">
          <label>Team 2 — Batting Second</label>
          <input
            type="text"
            value={team2Name}
            onChange={(e) => setTeam2Name(e.target.value)}
            placeholder="Team 2"
          />
        </div>

        <div className="setup-field">
          <label>Overs per Innings</label>
          <div className="overs-presets">
            {OVERS_PRESETS.map((o) => (
              <button
                key={o}
                className={`overs-preset-btn ${!useCustom && maxOvers === o ? "selected" : ""}`}
                onClick={() => { setMaxOvers(o); setUseCustom(false); }}
              >
                {o}
              </button>
            ))}
            <button
              className={`overs-preset-btn ${useCustom ? "selected" : ""}`}
              onClick={() => setUseCustom(true)}
            >
              Custom
            </button>
          </div>
          {useCustom && (
            <input
              type="number"
              min={1}
              max={50}
              value={customOvers}
              onChange={(e) => setCustomOvers(e.target.value)}
              placeholder="Enter overs"
              className="custom-overs-input"
              autoFocus
            />
          )}
        </div>

        <button className="start-match-btn" onClick={handleStart}>
          Start Match
        </button>
      </div>

      <div className="made-by">Made by Yash Sanathara</div>
    </div>
  );
};

// ── Result Screen ──────────────────────────────────────────────────────────────

const ResultScreen: React.FC<{
  config: GameConfig;
  team1Summary: InningsSummary;
  team2Score: Score;
  onNewMatch: () => void;
}> = ({ config, team1Summary, team2Score, onNewMatch }) => {
  const target = team1Summary.runs + 1;
  const team2Won = team2Score.runs >= target;
  const tied = team2Score.runs === team1Summary.runs && !team2Won;

  let resultText = "";
  if (tied) {
    resultText = "Match Tied!";
  } else if (team2Won) {
    const wktsLeft = 10 - team2Score.wickets;
    resultText = `${config.team2Name} won by ${wktsLeft} wicket${wktsLeft !== 1 ? "s" : ""}!`;
  } else {
    const margin = team1Summary.runs - team2Score.runs;
    resultText = `${config.team1Name} won by ${margin} run${margin !== 1 ? "s" : ""}!`;
  }

  return (
    <div className="result-screen">
      <img src={logo} alt="Logo" className="setup-logo" />

      <div className={`result-banner ${tied ? "result-tie" : team2Won ? "result-team2" : "result-team1"}`}>
        <div className="result-trophy">{tied ? "🤝" : "🏆"}</div>
        <div className="result-text">{resultText}</div>
      </div>

      <div className="result-scorecards">
        <div className={`result-card ${!team2Won && !tied ? "winner-card" : ""}`}>
          <div className="result-card-team">{config.team1Name}</div>
          <div className="result-card-score">{team1Summary.runs}/{team1Summary.wickets}</div>
          <div className="result-card-overs">({fmt(team1Summary.overs, team1Summary.balls)} ov)</div>
        </div>

        <div className="result-vs">vs</div>

        <div className={`result-card ${team2Won ? "winner-card" : ""}`}>
          <div className="result-card-team">{config.team2Name}</div>
          <div className="result-card-score">{team2Score.runs}/{team2Score.wickets}</div>
          <div className="result-card-overs">({fmt(team2Score.overs, team2Score.balls)} ov)</div>
        </div>
      </div>

      <button className="start-match-btn" onClick={onNewMatch}>
        New Match
      </button>

      <div className="made-by">Made by Yash Sanathara</div>
    </div>
  );
};

// ── Change Overs Dialog ────────────────────────────────────────────────────────

const CHANGE_OVERS_PRESETS = [6, 8, 10, 12, 15, 20];

const ChangeOversDialog: React.FC<{
  currentOvers: number;
  minOvers: number;
  onConfirm: (overs: number) => void;
  onCancel: () => void;
}> = ({ currentOvers, minOvers, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState(currentOvers);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(!CHANGE_OVERS_PRESETS.includes(currentOvers));

  const finalValue = useCustom ? parseInt(custom) || 0 : selected;
  const isValid = finalValue >= minOvers;

  return (
    <>
      <div className="dialog-overlay" onClick={onCancel} />
      <div className="change-overs-dialog">
        <h3>Change Match Overs</h3>
        <p className="change-overs-sub">Currently {currentOvers} overs. Overs already bowled: {minOvers - 1}.</p>
        <div className="overs-presets">
          {CHANGE_OVERS_PRESETS.map((o) => (
            <button
              key={o}
              className={`overs-preset-btn ${!useCustom && selected === o ? "selected" : ""} ${o < minOvers ? "disabled-preset" : ""}`}
              onClick={() => { if (o >= minOvers) { setSelected(o); setUseCustom(false); } }}
            >
              {o}
            </button>
          ))}
          <button
            className={`overs-preset-btn ${useCustom ? "selected" : ""}`}
            onClick={() => setUseCustom(true)}
          >
            Custom
          </button>
        </div>
        {useCustom && (
          <input
            type="number"
            min={minOvers}
            max={99}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={`Min ${minOvers}`}
            className="custom-overs-input"
            autoFocus
          />
        )}
        {!isValid && finalValue > 0 && (
          <p className="change-overs-error">Must be at least {minOvers} overs (overs already bowled).</p>
        )}
        <div className="end-innings-actions" style={{ marginTop: 20 }}>
          <button className="end-innings-confirm" onClick={() => onConfirm(finalValue)} disabled={!isValid}>
            Confirm
          </button>
          <button className="end-innings-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </>
  );
};

// ── Main Scoring Component ─────────────────────────────────────────────────────

const CricketGameTracker: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(
    () => (localStorage.getItem("cricketPhase") as Phase) || "setup"
  );
  const [gameConfig, setGameConfig] = useState<GameConfig>(() => {
    const s = localStorage.getItem("cricketGameConfig");
    return s ? JSON.parse(s) : { team1Name: "Team 1", team2Name: "Team 2", maxOvers: 10 };
  });
  const [team1Summary, setTeam1Summary] = useState<InningsSummary | null>(() => {
    const s = localStorage.getItem("cricketTeam1Summary");
    return s ? JSON.parse(s) : null;
  });

  const [isMuted, setIsMuted] = useState(() => localStorage.getItem("cricketMuted") === "true");
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const [score, setScore] = useState<Score>(() => {
    const s = localStorage.getItem("cricketScore");
    return s ? JSON.parse(s) : { runs: 0, wickets: 0, overs: 0, balls: 0, ballHistory: [] };
  });

  const [isNoBall, setIsNoBall] = useState(false);
  const [showRunOutDialog, setShowRunOutDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showEndInningsDialog, setShowEndInningsDialog] = useState(false);
  const [inningsLogs, setInningsLogs] = useState<InningsLog[]>(() => {
    const s = localStorage.getItem("inningsLogs");
    return s ? JSON.parse(s) : [];
  });
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showOversDialog, setShowOversDialog] = useState(false);
  const [boundaryRuns, setBoundaryRuns] = useState<4 | 6 | null>(null);
  const [newOverInfo, setNewOverInfo] = useState<{ overNumber: number; runs: number; isMaiden: boolean } | null>(null);
  const [showChangeOversDialog, setShowChangeOversDialog] = useState(false);

  const isMounted = useRef(false);
  const prevOversRef = useRef(score.overs);

  // Persistence
  useEffect(() => { localStorage.setItem("cricketPhase", phase); }, [phase]);
  useEffect(() => { localStorage.setItem("cricketGameConfig", JSON.stringify(gameConfig)); }, [gameConfig]);
  useEffect(() => { localStorage.setItem("cricketScore", JSON.stringify(score)); }, [score]);
  useEffect(() => { localStorage.setItem("inningsLogs", JSON.stringify(inningsLogs)); }, [inningsLogs]);
  useEffect(() => {
    if (team1Summary) localStorage.setItem("cricketTeam1Summary", JSON.stringify(team1Summary));
  }, [team1Summary]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      localStorage.setItem("cricketMuted", String(!prev));
      if (!prev) window.speechSynthesis?.cancel();
      return !prev;
    });
  };

  const announce = (text: string) => {
    if (!isMutedRef.current) speak(text);
  };

  // Voice announcements
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const overJustEnded = score.overs > prevOversRef.current;
    prevOversRef.current = score.overs;

    if (overJustEnded) {
      const completedOver = score.overs - 1;
      const overBalls = score.ballHistory.filter((b) => b.numberOfOver === completedOver);
      const overRuns = overBalls.reduce((sum, b) => sum + b.runs + (b.extras?.runs || 0), 0);
      const wides = overBalls.filter((b) => b.extras?.type === "wide").length;
      const noBalls = overBalls.filter((b) => b.extras?.type === "noBall").length;
      const totalExtras = wides + noBalls;
      const isMaiden = overRuns === 0 && totalExtras === 0;

      let text = `Over ${completedOver + 1} complete. ${overRuns} run${overRuns !== 1 ? "s" : ""}`;
      if (totalExtras > 0) {
        const parts: string[] = [];
        if (wides > 0) parts.push(`${wides} wide${wides > 1 ? "s" : ""}`);
        if (noBalls > 0) parts.push(`${noBalls} no ball${noBalls > 1 ? "s" : ""}`);
        text += `, ${parts.join(", ")}`;
      }
      text += `. Score ${score.runs} for ${score.wickets}.`;
      if (isMaiden) text = `Maiden over! Score ${score.runs} for ${score.wickets}.`;
      announce(text);

      // Show new-over popup only if more overs remain
      if (score.overs < gameConfig.maxOvers) {
        setNewOverInfo({ overNumber: completedOver + 1, runs: overRuns, isMaiden });
      }
      return;
    }

    if (score.ballHistory.length === 0) return;
    const last = score.ballHistory[score.ballHistory.length - 1];
    let prefix = "";
    if (last.isRunOut) prefix = "Run out! ";
    else if (last.isWicket) prefix = "Wicket! ";
    else if (last.runs === 6) prefix = "Six! ";
    else if (last.runs === 4) prefix = "Four! ";
    else if (last.extras?.type === "wide") prefix = "Wide. ";
    else if (last.extras?.type === "noBall") prefix = "No ball. ";

    announce(`${prefix}${score.runs} for ${score.wickets}`);
  }, [score]);

  // Auto-show end innings dialog when innings 1 overs are complete or all out
  useEffect(() => {
    if (phase !== "innings1") return;
    const oversComplete = score.overs >= gameConfig.maxOvers && score.balls === 0 && score.ballHistory.length > 0;
    const allOut = score.wickets >= 10;
    if (oversComplete || allOut) {
      setShowEndInningsDialog(true);
    }
  }, [score.overs, score.balls, score.wickets, phase, gameConfig.maxOvers, score.ballHistory.length]);

  // Auto-detect innings 2 end conditions
  useEffect(() => {
    if (phase !== "innings2" || !team1Summary) return;
    const target = team1Summary.runs + 1;
    const ballsBowled = score.overs * 6 + score.balls;
    const totalBalls = gameConfig.maxOvers * 6;

    if (score.runs >= target || ballsBowled >= totalBalls || score.wickets >= 10) {
      const t = setTimeout(() => setPhase("result"), 800);
      return () => clearTimeout(t);
    }
  }, [score, phase, team1Summary, gameConfig.maxOvers]);

  // Chase info
  const chaseInfo = (() => {
    if (phase !== "innings2" || !team1Summary) return null;
    const target = team1Summary.runs + 1;
    const ballsBowled = score.overs * 6 + score.balls;
    const ballsRemaining = Math.max(0, gameConfig.maxOvers * 6 - ballsBowled);
    const runsNeeded = Math.max(0, target - score.runs);
    const crr = ballsBowled > 0 ? ((score.runs / ballsBowled) * 6).toFixed(2) : "0.00";
    const rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : "—";
    return { target, runsNeeded, ballsRemaining, crr, rrr };
  })();

  const handleBall = (
    runs: number,
    isWicket = false,
    extras?: Ball["extras"],
    isRunOut = false
  ) => {
    const newBall: Ball = { runs, isWicket, isRunOut, extras, numberOfBall: score.balls, numberOfOver: score.overs };
    setScore((prev) => {
      const ovr = extras ? prev.overs : prev.balls + 1 === 6 ? prev.overs + 1 : prev.overs;
      const lastNum = (prev.ballHistory || []).length > 0
        ? prev.ballHistory[prev.ballHistory.length - 1].numberOfBall
        : 0;
      return {
        runs: prev.runs + runs + (extras?.runs || 0),
        wickets: prev.wickets + (isWicket ? 1 : 0),
        overs: ovr,
        balls: extras ? prev.balls : prev.balls + 1 === 6 ? 0 : prev.balls + 1,
        ballHistory: [...prev.ballHistory, { ...newBall, numberOfBall: lastNum + 1, numberOfOver: prev.overs }],
      };
    });
    setIsNoBall(false);
    if (!extras && runs === 6) { setBoundaryRuns(6); playBoundaryAudio("six"); }
    else if (!extras && runs === 4) { setBoundaryRuns(4); }
    if (isWicket) playBoundaryAudio("out");
  };

  const undoLastBall = () => {
    if (score.ballHistory.length === 0) return;
    const last = score.ballHistory[score.ballHistory.length - 1];
    setScore((prev) => {
      const s = { ...prev, ballHistory: prev.ballHistory.slice(0, -1) };
      if (last.extras?.type === "wide") {
        s.runs = prev.runs - 1;
      } else if (last.extras?.type === "noBall") {
        s.runs = prev.runs - last.runs - 1;
      } else {
        s.runs = prev.runs - last.runs;
        if (prev.balls === 0) { s.overs = prev.overs - 1; s.balls = 5; }
        else { s.balls = prev.balls - 1; }
      }
      if (last.isWicket) s.wickets = prev.wickets - 1;
      return s;
    });
  };

  const clearScore = () => {
    setScore({ runs: 0, wickets: 0, overs: 0, balls: 0, ballHistory: [] });
    setIsNoBall(false);
  };

  const endInnings1 = () => {
    setTeam1Summary({ runs: score.runs, wickets: score.wickets, overs: score.overs, balls: score.balls });
    clearScore();
    setShowEndInningsDialog(false);
    setPhase("innings2");
  };

  const endInnings2 = () => {
    setShowEndInningsDialog(false);
    setPhase("result");
  };

  const startNewMatch = () => {
    clearScore();
    setTeam1Summary(null);
    localStorage.removeItem("cricketTeam1Summary");
    setPhase("setup");
  };

  const getOversHistory = () => {
    const map = new Map<number, Ball[]>();
    score.ballHistory.forEach((b) => {
      if (!map.has(b.numberOfOver)) map.set(b.numberOfOver, []);
      map.get(b.numberOfOver)!.push(b);
    });
    return Array.from(map.entries()).sort(([a], [b]) => b - a);
  };

  const renderBallItem = (ball: Ball, index: number) => {
    if (ball.extras?.type === "wide") return <div key={index} className="ball-item">WIDE</div>;
    return (
      <div
        key={index}
        className={`ball-item ${ball.extras?.type === "noBall" ? "no-ball" : ""} ${
          ball.runs === 4 || ball.runs === 6 ? "boundary" : ""
        } ${ball.isWicket ? "wicket" : ""}`}
      >
        {ball.runs}
        {ball.isRunOut ? (
          <span className="run-out-label">RO</span>
        ) : ball.isWicket ? (
          <WicketIcon className="wicket-icon" />
        ) : ball.runs === 4 || ball.runs === 6 ? (
          <BoundaryIcon className="boundary-icon" />
        ) : null}
        {ball.extras ? `(${ball.extras.type})` : ""}
      </div>
    );
  };

  // ── Screen routing ──────────────────────────────────────────────────────────

  if (phase === "setup") {
    return (
      <SetupScreen
        onStart={(config) => {
          setGameConfig(config);
          clearScore();
          setPhase("innings1");
        }}
      />
    );
  }

  if (phase === "result" && team1Summary) {
    return (
      <ResultScreen
        config={gameConfig}
        team1Summary={team1Summary}
        team2Score={score}
        onNewMatch={startNewMatch}
      />
    );
  }

  const battingTeam = phase === "innings1" ? gameConfig.team1Name : gameConfig.team2Name;
  const fieldingTeam = phase === "innings1" ? gameConfig.team2Name : gameConfig.team1Name;
  const innings1Done = phase === "innings1" && (score.overs >= gameConfig.maxOvers || score.wickets >= 10);
  const innings2Done = phase === "innings2" && score.wickets >= 10;

  // ── Scoring UI ──────────────────────────────────────────────────────────────

  return (
    <div className="cricket-tracker">
      <div className="app-bg-logo" style={{ backgroundImage: `url(${logo})` }} />

      {/* Match context header */}
      <div className="match-phase-header">
        <span className="phase-pill">{phase === "innings1" ? "1st Innings" : "2nd Innings"}</span>
        <span className="batting-team-label">{battingTeam}</span>
        <span className="vs-label">vs {fieldingTeam}</span>
      </div>

      {/* Chase bar — innings 2 only */}
      {chaseInfo && (
        <div className="chase-bar">
          <div className="chase-target-label">Target: {chaseInfo.target}</div>
          <div className="chase-need-label">
            Need <strong>{chaseInfo.runsNeeded}</strong> off{" "}
            <strong>{chaseInfo.ballsRemaining}</strong> balls
          </div>
          <div className="chase-rates-row">
            <span>CRR {chaseInfo.crr}</span>
            <span>RRR {chaseInfo.rrr}</span>
          </div>
        </div>
      )}

      {/* Ball history */}
      <div className="ball-history">
        <div className="history-list">
          <div className="ball-item-over">{score.overs + 1}</div>
          {score.ballHistory
            .filter((b) => score.overs === 0 || b.numberOfOver === score.overs)
            .sort((a, b) => b.numberOfBall - a.numberOfBall)
            .map(renderBallItem)}
        </div>
      </div>

      {/* Score display */}
      <div className="score-display">
        <button className="mute-button" onClick={toggleMute} title={isMuted ? "Unmute voice" : "Mute voice"}>
          {isMuted ? "🔇 Muted" : "🔊 Voice On"}
        </button>
        <h2>Score: {score.runs}/{score.wickets}</h2>
        <h3>
          Overs: {score.overs}.{score.balls} /{" "}
          <span
            className={phase === "innings1" ? "max-overs-editable" : ""}
            onClick={() => phase === "innings1" && setShowChangeOversDialog(true)}
            title={phase === "innings1" ? "Tap to change match overs" : undefined}
          >
            {gameConfig.maxOvers}
            {phase === "innings1" && <span className="max-overs-edit-hint"> ✎</span>}
          </span>
          <a onClick={() => setShowOversDialog(true)} className="over-history-link">
            {" "}Over History{" "}
          </a>
        </h3>
      </div>

      {/* Scoring buttons */}
      <div className="ball-controls">
        <div className="runs-buttons">
          {[0, 1, 2, 3, 4, 5, 6].map((run) => (
            <button key={run} onClick={() => handleBall(run)} className={isNoBall ? "active" : ""} disabled={innings1Done || innings2Done}>
              {run}
            </button>
          ))}
        </div>
        <div className="special-buttons">
          <button className="wicket-button" onClick={() => handleBall(0, true)} disabled={isNoBall || innings1Done || innings2Done}>🎯 Wicket</button>
          <button className="wide-button" onClick={() => handleBall(0, false, { type: "wide", runs: 1 })} disabled={isNoBall || innings1Done || innings2Done}>↔ Wide</button>
          <button
            onClick={() => { setIsNoBall(true); handleBall(0, false, { type: "noBall", runs: 1 }); }}
            className="no-ball-button"
            disabled={isNoBall || innings1Done || innings2Done}
          >
            ⚡ No Ball
          </button>
          <button onClick={() => setShowRunOutDialog(true)} className="run-out-button" disabled={isNoBall || innings1Done || innings2Done}>
            🏃 Run Out
          </button>
        </div>
      </div>

      <div className="innings-buttons">
        <button onClick={undoLastBall} className="undo-button" disabled={score.ballHistory.length === 0}>
          ↩ Undo
        </button>
        <button
          onClick={() => setShowEndInningsDialog(true)}
          className="save-innings-button"
          disabled={phase === "innings1" && score.ballHistory.length === 0}
        >
          {phase === "innings1" ? "End Inn." : "End Match"}
        </button>
        <button onClick={() => setShowLogsDialog(true)} className="view-logs-button">Logs</button>
        <button onClick={() => setShowConfirmDialog(true)} className="clear-button">Clear</button>
      </div>

      {/* ── Logs dialog ── */}
      {showLogsDialog && (
        <>
          <div className="dialog-overlay" onClick={() => setShowLogsDialog(false)} />
          <div className="logs-dialog">
            <h3>Innings Logs</h3>
            <div className="logs-list">
              {inningsLogs.length === 0 ? (
                <p className="no-logs">No innings saved yet</p>
              ) : (
                inningsLogs.map((log) => (
                  <div key={log.timestamp} className="log-item">
                    <div className="log-content">
                      <div className="team-name">{log.teamName}</div>
                      <div className="log-score">{log.runs}/{log.wickets}</div>
                      <div className="log-overs">({log.overs}.{log.balls})</div>
                    </div>
                    <button
                      onClick={() => setInningsLogs((p) => p.filter((l) => l.timestamp !== log.timestamp))}
                      className="delete-log-button"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowLogsDialog(false)} className="close-button">Close</button>
          </div>
        </>
      )}

      {/* ── Overs history dialog ── */}
      {showOversDialog && (
        <>
          <div className="dialog-overlay" onClick={() => setShowOversDialog(false)} />
          <div className="overs-dialog">
            <div className="overs-dialog-header">
              <h3>Overs History</h3>
              <button onClick={() => setShowOversDialog(false)} className="close-dialog-button">×</button>
            </div>
            <div className="overs-list">
              {getOversHistory().map(([over, balls]) => (
                <div key={over} className="over-item">
                  <div className="over-header">
                    <span className="over-number">Over {over + 1}</span>
                    <span className="over-summary">
                      {balls.reduce((sum, b) => sum + b.runs + (b.extras?.runs || 0), 0)} runs
                      {balls.some((b) => b.isWicket) && " • Wicket"}
                    </span>
                  </div>
                  <div className="over-balls">
                    {balls.sort((a, b) => a.numberOfBall - b.numberOfBall).map(renderBallItem)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Run out dialog ── */}
      {showRunOutDialog && (
        <>
          <div className="dialog-overlay" onClick={() => setShowRunOutDialog(false)} />
          <div className="run-out-dialog">
            <h3>Run Out — Runs Scored?</h3>
            <p>How many runs did they complete before the run out?</p>
            <div className="run-out-options">
              {[0, 1, 2, 3].map((r) => (
                <button
                  key={r}
                  className="run-out-option-btn"
                  onClick={() => { handleBall(r, true, undefined, true); setShowRunOutDialog(false); }}
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="close-button" onClick={() => setShowRunOutDialog(false)}>Cancel</button>
          </div>
        </>
      )}

      {/* ── End innings confirmation dialog ── */}
      {showEndInningsDialog && (
        <>
          <div className="dialog-overlay" onClick={() => setShowEndInningsDialog(false)} />
          <div className="end-innings-dialog">
            <h3>{phase === "innings1" ? "End Innings?" : "End Match?"}</h3>
            <p>
              {phase === "innings1"
                ? innings1Done
                  ? `All ${gameConfig.maxOvers} overs complete! ${gameConfig.team1Name} scored ${score.runs}/${score.wickets}. Start ${gameConfig.team2Name}'s chase?`
                  : `${gameConfig.team1Name} scored ${score.runs}/${score.wickets} in ${fmt(score.overs, score.balls)} overs. Start ${gameConfig.team2Name}'s chase?`
                : `Confirm end of match. ${gameConfig.team2Name} scored ${score.runs}/${score.wickets}.`}
            </p>
            <div className="end-innings-actions">
              <button
                className="end-innings-confirm"
                onClick={phase === "innings1" ? endInnings1 : endInnings2}
              >
                {phase === "innings1" ? "Start Chase" : "End Match"}
              </button>
              <button className="end-innings-cancel" onClick={() => setShowEndInningsDialog(false)}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── New over popup ── */}
      {newOverInfo && (
        <>
          <div className="dialog-overlay" onClick={() => setNewOverInfo(null)} />
          <div className="new-over-dialog">
            <div className="new-over-header">
              {newOverInfo.isMaiden ? "🎯 Maiden Over!" : `Over ${newOverInfo.overNumber} Complete`}
            </div>
            <div className="new-over-runs">
              {newOverInfo.runs} run{newOverInfo.runs !== 1 ? "s" : ""} this over
            </div>
            <div className="new-over-score">
              Score: {score.runs}/{score.wickets}
            </div>
            <div className="new-over-actions">
              <button
                className="new-over-btn new-over-continue"
                onClick={() => setNewOverInfo(null)}
              >
                ▶ Continue
              </button>
              <button
                className="new-over-btn new-over-undo"
                onClick={() => { undoLastBall(); setNewOverInfo(null); }}
                disabled={score.ballHistory.length === 0}
              >
                ↩ Undo Ball
              </button>
              <button
                className="new-over-btn new-over-end"
                onClick={() => { setNewOverInfo(null); setShowEndInningsDialog(true); }}
              >
                ⏹ End Innings
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Change match overs dialog (innings 1 only) ── */}
      {showChangeOversDialog && (
        <ChangeOversDialog
          currentOvers={gameConfig.maxOvers}
          minOvers={score.overs + 1}
          onConfirm={(newOvers) => {
            setGameConfig((prev) => ({ ...prev, maxOvers: newOvers }));
            setShowChangeOversDialog(false);
          }}
          onCancel={() => setShowChangeOversDialog(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={() => { clearScore(); setShowConfirmDialog(false); }}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {boundaryRuns && (
        <BoundaryAnimation runs={boundaryRuns} onDone={() => setBoundaryRuns(null)} />
      )}

      <div className="made-by">Made by Yash Sanathara</div>
    </div>
  );
};

export default CricketGameTracker;
