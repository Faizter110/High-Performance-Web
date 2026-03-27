import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { getGetMatchStateQueryKey, GameState } from "@workspace/api-client-react";

export function useGameSync(matchId: number | null) {
  const queryClient = useQueryClient();
  const socket = getSocket();
  const [buzzer, setBuzzer] = useState<string | null>(null);
  const matchIdRef = useRef(matchId);
  matchIdRef.current = matchId;

  useEffect(() => {
    if (!matchId) return;

    const joinRoom = () => {
      socket.emit("joinMatch", matchId);
    };

    joinRoom();

    const handleGameState = (state: GameState) => {
      if (state.matchId !== matchIdRef.current) return;
      queryClient.setQueryData(getGetMatchStateQueryKey(matchIdRef.current!), state);
      setBuzzer(state.buzzerStatus ?? null);
    };

    const handleBuzzer = ({ team }: { team: string }) => {
      setBuzzer(team);
    };

    const handleResetBuzzer = () => {
      setBuzzer(null);
    };

    socket.on("gameState", handleGameState);
    socket.on("buzzer", handleBuzzer);
    socket.on("resetBuzzer", handleResetBuzzer);
    socket.on("connect", joinRoom);

    return () => {
      socket.emit("leaveMatch", matchId);
      socket.off("gameState", handleGameState);
      socket.off("buzzer", handleBuzzer);
      socket.off("resetBuzzer", handleResetBuzzer);
      socket.off("connect", joinRoom);
    };
  }, [matchId, queryClient, socket]);

  const emitBuzz = (team: string) => {
    if (matchIdRef.current) socket.emit("buzz", { matchId: matchIdRef.current, team: team.toLowerCase() });
  };

  const emitResetBuzzer = () => {
    if (matchIdRef.current) socket.emit("resetBuzzer", { matchId: matchIdRef.current });
  };

  const emitOpenBlock = (blockIndex: number) => {
    if (matchIdRef.current) socket.emit("openBlock", { matchId: matchIdRef.current, blockIndex });
  };

  const emitAwardBlock = (blockIndex: number, team: string, questionId?: number | null) => {
    if (matchIdRef.current) socket.emit("awardBlock", { matchId: matchIdRef.current, blockIndex, team: team.toLowerCase(), questionId: questionId ?? null });
  };

  return { buzzer, emitBuzz, emitResetBuzzer, emitOpenBlock, emitAwardBlock };
}
