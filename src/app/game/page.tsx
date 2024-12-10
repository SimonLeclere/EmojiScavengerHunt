"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GamePage from "./GamePage"; // Rename the current component

function GamePageContent() {
  const searchParams = useSearchParams();
  const player = searchParams.get("player");

  return <GamePage player={player} />;
}

export default function GamePageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePageContent />
    </Suspense>
  );
}