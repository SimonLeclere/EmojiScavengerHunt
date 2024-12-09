"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

const EMOJIS_TO_FIND = 5;

export default function Game() {
  const searchParams = useSearchParams();
  const player = searchParams.get("player");

  const [currentEmoji, setCurrentEmoji] = useState("😄");
  const [apiEmoji, setApiEmoji] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [scoreAnimate, setScoreAnimate] = useState(false);
  const [foundCount, setFoundCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Predefined emojis for the game
  const emojis = useMemo(
    () => [
      "🍎",
      "🖋️",
      "📱",
      "🖥️",
      "📚",
      "🍽️",
      "🍷",
      "🍪",
      "🧴",
      "📦",
      "🎮",
      "✌️",
      "👍",
      "😡",
    ],
    []
  );

  const alreadyUsedEmojis = useRef(new Set<string>());

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // this triggers the browser's permission dialog
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Erreur d'accès à la caméra :", error);
      }
    }
    startCamera();
  }, []);

  const endGame = useCallback(() => {
    console.log("Game ended, player:", player, "score:", scoreRef.current);
  
    updateLeaderboard(player || "Anonymous", scoreRef.current);
  
    // Trigger confetti animation to celebrate the end of the game
    confetti({
      particleCount: 500,
      spread: 120,
      origin: { y: 0.6 },
      startVelocity: 60,
      decay: 0.9,
    });
  
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }, [player]);
  

  // Update the leaderboard with the player's score and save it to local storage
  const updateLeaderboard = (playerName: string, playerScore: number) => {    
    const leaderboard: { name: string; score: number }[] = JSON.parse(
      localStorage.getItem("leaderboard") || "[]"
    );

    const existingPlayer = leaderboard.find(
      (entry) => entry.name === playerName
    );

    if (existingPlayer) {
      if (playerScore > existingPlayer.score) {
        existingPlayer.score = playerScore;
      }
    } else {
      leaderboard.push({ name: playerName, score: playerScore });
    }

    leaderboard.sort((a, b) => b.score - a.score);

    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
  };

  const chooseNewEmoji = useCallback(() => {
    let newEmoji;
  
    // If all emojis are used, reset the used emojis set
    if (alreadyUsedEmojis.current.size >= emojis.length) {
      const randomIndex = Math.floor(Math.random() * emojis.length);
      newEmoji = emojis[randomIndex];
      alreadyUsedEmojis.current.clear();
    } else {
      // Select a new emoji that hasn't been used before
      do {
        const randomIndex = Math.floor(Math.random() * emojis.length);
        newEmoji = emojis[randomIndex];
      } while (alreadyUsedEmojis.current.has(newEmoji));
    }
  
    setCurrentEmoji(newEmoji);
    alreadyUsedEmojis.current.add(newEmoji);
    setStartTime(Date.now()); // Reset start time
  }, [emojis]);

  useEffect(() => {
    chooseNewEmoji();
  }, [chooseNewEmoji]);

  useEffect(() => {
    const captureAndSendImage = async () => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context) {
          // Draw the current video frame on the canvas
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(
            videoRef.current,
            0,
            0,
            canvas.width,
            canvas.height
          );

          const imageBase64 = canvas.toDataURL("image/png");

          if (!imageBase64.startsWith("data:image/png")) {
            console.log("Erreur lors de la capture de l'image");
            return;
          }

          try {
            const response = await fetch("/api/mistral", {
              method: "POST",
              headers: { "Content-Type": "application/text" },
              body: imageBase64,
            });

            if (response.ok) {
              const data = await response.json();
              setApiEmoji(data.result);

              // If the API returns the correct emoji, update the score and emoji count
              if (data.result === currentEmoji) {
                const elapsedTime = (Date.now() - startTime) / 1000;
                const points = Math.max(10, 100 - Math.floor(elapsedTime * 10));

                setScore((prevScore) => {
                  const newScore = prevScore + points;
                  scoreRef.current = newScore;
                  return newScore;
                });
                
                setFoundCount((prevCount) => {
                  const newCount = prevCount + 1;
                  if (newCount === EMOJIS_TO_FIND) {
                    endGame();
                  }
                  return newCount;
                });

                chooseNewEmoji();

                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                });
              }

              setAnimate(true); // animate the emoji change
              setScoreAnimate(true);
              setTimeout(() => setAnimate(false), 1000);
              setTimeout(() => setScoreAnimate(false), 500);
            } else {
              console.log("Erreur lors de l'envoi de l'image à l'API");
            }
          } catch (error) {
            console.log("Erreur lors de l'envoi de l'image :", error);
          }
        }
      }
    };

    const intervalId = setInterval(captureAndSendImage, 4000); // Capture and send image every 4 seconds
    return () => clearInterval(intervalId);
  }, [chooseNewEmoji, currentEmoji, endGame, startTime]);

  return (
    <div className="min-h-screen bg-orange-600 relative">
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-orange-500 text-white">
        <div>
          <span className="font-bold text-2xl">{player}</span>
          <span className="ml-4">
            <span
              className={`transition-transform duration-500 ${
                scoreAnimate ? "text-yellow-300" : ""
              }`}
            >
              Score: {score}
            </span>
          </span>
        </div>
        <div className="text-4xl">{currentEmoji}</div>
      </div>

      <div className="absolute top-16 left-0 right-0 z-10 p-4">
        <div className="w-full bg-gray-300 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${(foundCount / EMOJIS_TO_FIND) * 100}%` }}
          ></div>
        </div>
        <div className="text-white text-center mt-2">
          {foundCount} / {EMOJIS_TO_FIND} emojis found
        </div>
      </div>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover absolute top-0 left-0 transform scale-x-[-1]"
      ></video>

      <canvas ref={canvasRef} className="hidden"></canvas>

      {apiEmoji && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-8xl transition-transform duration-500 ${
            animate ? "scale-150" : "scale-100"
          }`}
        >
          {apiEmoji}
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center space-x-4 p-4">
        <button
          className="bg-blue-500 text-white py-2 px-6 rounded-full hover:bg-blue-700 transition duration-200"
          onClick={chooseNewEmoji}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
