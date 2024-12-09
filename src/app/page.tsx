"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

export default function Home() {
  const router = useRouter();

  const [pseudo, setPseudo] = useState("");
  const [currentEmoji, setCurrentEmoji] = useState("😄");
  const [animate, setAnimate] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    { name: string; score: number }[]
  >([]);

  const emojis = useMemo(() => ["😄", "🎉", "🚀", "🕵️", "🤩", "😎"], []);

  useEffect(() => {
    const storedLeaderboard = localStorage.getItem("leaderboard");
    if (storedLeaderboard) {
      setLeaderboard(JSON.parse(storedLeaderboard));
    } else {
      const initialLeaderboard: { name: string; score: number }[] = [];
      setLeaderboard(initialLeaderboard);
      localStorage.setItem("leaderboard", JSON.stringify(initialLeaderboard));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);

      setCurrentEmoji((prevEmoji) => {
        const currentIndex = emojis.indexOf(prevEmoji);
        return emojis[(currentIndex + 1) % emojis.length];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [emojis]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-600 p-4">
      <h1 className="text-6xl font-extrabold mb-14 text-white drop-shadow-lg">
        Em
        <span
          className={`inline-block transition-transform duration-500 ${
            animate ? "scale-110" : ""
          }`}
        >
          {currentEmoji}
        </span>
        ji Scavenger Hunt
      </h1>

      <input
        type="text"
        placeholder="Enter your pseudo"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        className="w-full max-w-xs px-4 py-2 mb-4 border rounded-md focus:outline-none text-gray-500"
      />

      <button
        onClick={() => {
          if (pseudo.trim()) {
            router.push(`/game?player=${encodeURIComponent(pseudo)}`);
          }
        }}
        className="w-full max-w-xs px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Start game!
      </button>

      <div className="mt-8 w-full max-w-xs bg-white p-4 rounded-md shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-800">
          Leaderboard
        </h2>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-500">
            No scores for this session
          </p>
        ) : (
          <ul className="list-none">
            {leaderboard.map((player, index) => (
              <li
                key={index}
                className={`flex justify-between py-2 px-2 rounded-md ${
                  index % 2 === 0 ? "bg-gray-100" : "bg-white"
                }`}
              >
                <span className="font-medium text-gray-800">{player.name}</span>
                <span className="font-bold text-blue-600">{player.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
