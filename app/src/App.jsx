import React, { useState } from "react";
import TopPage from "./components/TopPage.jsx";
import Countdown from "./components/Countdown.jsx";
import Game from "./components/Game.jsx";
import { getUser, getRank } from "./ranking.js";

export default function App() {
  const [screen, setScreen] = useState("top"); // top | countdown | playing
  const [difficulty, setDifficulty] = useState("normal");
  const [count, setCount] = useState(5); // 問題数: 1 | 5 | 10
  const [user, setUser] = useState(getUser());
  const [ranking, setRanking] = useState(getRank());

  return (
    <div>
      {screen === "top" && (
        <TopPage
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          count={count}
          setCount={setCount}
          user={user}
          setUser={setUser}
          ranking={ranking}
          onStart={() => setScreen("countdown")}
        />
      )}

      {screen === "countdown" && (
        <Countdown onDone={() => setScreen("playing")} />
      )}

      {screen === "playing" && (
        <Game
          difficulty={difficulty}
          count={count}
          user={user}
          ranking={ranking}
          setRanking={setRanking}
          onExit={() => setScreen("top")}
        />
      )}
    </div>
  );
}
