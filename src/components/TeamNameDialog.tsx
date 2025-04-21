import React, { useState } from "react";

interface TeamNameDialogProps {
  isOpen: boolean;
  onSubmit: (teamName: string) => void;
}

const TeamNameDialog: React.FC<TeamNameDialogProps> = ({
  isOpen,
  onSubmit,
}) => {
  const [teamName, setTeamName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onSubmit(teamName.trim());
      setTeamName("");
    }
  };

  return (
    <>
      <div className="dialog-overlay" />
      <div className="team-name-dialog">
        <h3>Enter Team Name</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team Name"
            autoFocus
          />
          <button type="submit" disabled={!teamName.trim()}>
            Start Innings
          </button>
        </form>
      </div>
    </>
  );
};

export default TeamNameDialog;
