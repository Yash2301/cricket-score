import React, { useEffect, useRef } from "react";
import "./BoundaryAnimation.css";
import logo from "../../logo.png";

interface Props {
  runs: 4 | 6;
  onDone: () => void;
}

const SPARK_COUNT = 18;

const BoundaryAnimation: React.FC<Props> = ({ runs, onDone }) => {
  const isSix = runs === 6;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="ba-overlay" onClick={onDone}>
      <div className={`ba-card ${isSix ? "ba-six" : "ba-four"}`}>
        <img src={logo} alt="Cricket Paglu" className="ba-logo" />

        <div className="ba-runs">{runs}</div>
        <div className="ba-label">
          {isSix ? "🚁 HELICOPTER SHOT!" : "🏏 BOUNDARY!"}
        </div>

        <div className="ba-sparks">
          {Array.from({ length: SPARK_COUNT }).map((_, i) => (
            <div
              key={i}
              className="ba-spark"
              style={
                {
                  "--angle": `${(360 / SPARK_COUNT) * i}deg`,
                  "--delay": `${(i % 5) * 0.04}s`,
                  "--color": i % 3 === 0 ? "#fff" : i % 3 === 1 ? "#FFD700" : "#FFF9C4",
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BoundaryAnimation;
