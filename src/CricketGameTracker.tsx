import React, { useState, useEffect } from "react";
import "./CricketGameTracker.css";
import ConfirmDialog from "./components/ConfirmDialog";

interface Ball {
  runs: number;
  isWicket: boolean;
  extras?: {
    type: "wide" | "noBall" | "byes" | "legByes";
    runs: number;
  };
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

const CricketGameTracker: React.FC = () => {
  const [score, setScore] = useState<Score>(() => {
    const savedScore = localStorage.getItem("cricketScore");
    return savedScore
      ? JSON.parse(savedScore)
      : {
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          ballHistory: [],
        };
  });

  const [isNoBall, setIsNoBall] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [inningsLogs, setInningsLogs] = useState<InningsLog[]>(() => {
    const savedLogs = localStorage.getItem("inningsLogs");
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [showLogsDialog, setShowLogsDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem("cricketScore", JSON.stringify(score));
  }, [score]);

  useEffect(() => {
    localStorage.setItem("inningsLogs", JSON.stringify(inningsLogs));
  }, [inningsLogs]);

  const handleBall = (
    runs: number,
    isWicket: boolean = false,
    extras?: Ball["extras"]
  ) => {
    const newBall: Ball = { runs, isWicket, extras };
    setScore((prev) => ({
      runs: prev.runs + runs + (extras?.runs || 0),
      wickets: prev.wickets + (isWicket ? 1 : 0),
      overs: extras
        ? prev.overs
        : prev.balls + 1 === 6
        ? prev.overs + 1
        : prev.overs,
      balls: extras ? prev.balls : prev.balls + 1 === 6 ? 0 : prev.balls + 1,
      ballHistory: [...prev.ballHistory, newBall],
    }));
    setIsNoBall(false);
  };

  const undoLastBall = () => {
    if (score.ballHistory.length === 0) return;

    const lastBall = score.ballHistory[score.ballHistory.length - 1];

    setScore((prev) => {
      const newState = { ...prev };
      newState.ballHistory = prev.ballHistory.slice(0, -1);

      if (lastBall.extras?.type === "wide") {
        newState.runs = prev.runs - 1;
      } else if (lastBall.extras?.type === "noBall") {
        newState.runs = prev.runs - lastBall.runs - 1;
      } else {
        newState.runs = prev.runs - lastBall.runs;
        if (prev.balls === 0) {
          newState.overs = prev.overs - 1;
          newState.balls = 5;
        } else {
          newState.balls = prev.balls - 1;
        }
      }

      if (lastBall.isWicket) {
        newState.wickets = prev.wickets - 1;
      }

      return newState;
    });
  };

  const clearAllData = () => {
    setScore({
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      ballHistory: [],
    });
    setIsNoBall(false);
  };

  const saveInnings = () => {
    const teamName = prompt("Enter team name:");
    if (teamName) {
      const newLog: InningsLog = {
        teamName,
        runs: score.runs,
        wickets: score.wickets,
        overs: score.overs,
        balls: score.balls,
        timestamp: Date.now(),
      };
      setInningsLogs((prev) => [...prev, newLog]);
      clearAllData();
    }
  };

  const deleteInningsLog = (timestamp: number) => {
    setInningsLogs((prev) => prev.filter((log) => log.timestamp !== timestamp));
  };

  return (
    <div className="cricket-tracker">
      <div className="ball-history">
        <div className="history-list">
          {score.ballHistory.map((ball, index) => (
            <div
              key={index}
              className={`ball-item ${
                ball.extras?.type === "noBall" ? "no-ball" : ""
              }`}
            >
              {ball.runs}
              {ball.isWicket ? "W" : ""}
              {ball.extras ? `(${ball.extras.type})` : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="score-display">
        <h2>
          Score: {score.runs}/{score.wickets}
        </h2>
        <h3>
          Overs: {score.overs}.{score.balls}
        </h3>
      </div>

      <div className="ball-controls">
        <div className="runs-buttons">
          {[0, 1, 2, 3, 4, 5, 6].map((run) => (
            <button
              key={run}
              onClick={() => handleBall(run)}
              className={isNoBall ? "active" : ""}
            >
              {run}
            </button>
          ))}
        </div>
        <div className="special-buttons">
          <button onClick={() => handleBall(0, true)} disabled={isNoBall}>
            Wicket
          </button>
          <button
            onClick={() => handleBall(0, false, { type: "wide", runs: 1 })}
            disabled={isNoBall}
          >
            Wide
          </button>
          <button
            onClick={() => {
              setIsNoBall(true);
              handleBall(0, false, { type: "noBall", runs: 1 });
            }}
            className="no-ball-button"
            disabled={isNoBall}
          >
            No Ball
          </button>
        </div>
      </div>

      <div className="action-buttons">
        <button
          onClick={undoLastBall}
          className="undo-button"
          disabled={score.ballHistory.length === 0}
        >
          Undo Last Ball
        </button>
      </div>

      <div className="innings-buttons">
        <button
          onClick={saveInnings}
          className="save-innings-button"
          disabled={score.ballHistory.length === 0}
        >
          Save Innings
        </button>
        <button
          onClick={() => setShowLogsDialog(true)}
          className="view-logs-button"
        >
          View Logs
        </button>
        <button
          onClick={() => setShowConfirmDialog(true)}
          className="clear-button"
        >
          Clear All
        </button>
      </div>

      {showLogsDialog && (
        <>
          <div
            className="dialog-overlay"
            onClick={() => setShowLogsDialog(false)}
          />
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
                      <div className="log-score">
                        {log.runs}/{log.wickets}
                      </div>
                      <div className="log-overs">
                        ({log.overs}.{log.balls})
                      </div>
                    </div>
                    <button
                      onClick={() => deleteInningsLog(log.timestamp)}
                      className="delete-log-button"
                      title="Delete this innings"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowLogsDialog(false)}
              className="close-button"
            >
              Close
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onConfirm={() => {
          clearAllData();
          setShowConfirmDialog(false);
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};

export default CricketGameTracker;
