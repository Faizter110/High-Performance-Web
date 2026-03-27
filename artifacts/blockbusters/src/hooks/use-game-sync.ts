import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { getGetMatchStateQueryKey, GameState } from "@workspace/api-client-react";

export function useGameSync(matchId: number | null) {
  const queryClient = useQueryClient();
  const socket = getSocket();
  const [buzzer, setBuzzer] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    socket.emit("joinMatch", matchId);

    const handleGameState = (state: GameState) => {
      if (state.matchId !== matchId) return; // ignore events for other match rooms
      queryClient.setQueryData(getGetMatchStateQueryKey(matchId), state);
      if (state.buzzerStatus) {
        setBuzzer(state.buzzerStatus);
      } else {
        setBuzzer(null);
      }
    };

    const handleBuzzer = (team: string) => {
      setBuzzer(team);
    };

    const handleResetBuzzer = () => {
      setBuzzer(null);
    };

    socket.on("gameState", handleGameState);
    socket.on("buzzer", handleBuzzer);
    socket.on("resetBuzzer", handleResetBuzzer);

    return () => {
      socket.emit("leaveMatch", matchId);
      socket.off("gameState", handleGameState);
      socket.off("buzzer", handleBuzzer);
      socket.off("resetBuzzer", handleResetBuzzer);
    };
  }, [matchId, queryClient, socket]);

  const emitBuzz = (team: string) => {
    if (matchId) socket.emit("buzz", { matchId, team });
  };

  const emitResetBuzzer = () => {
    if (matchId) socket.emit("resetBuzzer", { matchId });
  };

  return { buzzer, emitBuzz, emitResetBuzzer };
}
