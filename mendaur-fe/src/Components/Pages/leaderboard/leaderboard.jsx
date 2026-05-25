import React from "react";
import LeaderboardHeader from "../leaderboard/leaderboardHeader";
import LeaderboardTable from "../leaderboard/leaderboardTable";
import "./leaderboard.css";

const Leaderboard = () => {
  return (
    <main className="leaderboard-page">
      <LeaderboardHeader />
      <LeaderboardTable />
    </main>
  );
};

export default Leaderboard;
