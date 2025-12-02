import { useEffect, useRef } from 'react';
import { Game } from './Game';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (canvasRef.current && !gameRef.current) {
      const game = new Game();
      gameRef.current = game;

      game.initialize(canvasRef.current).catch(err => {
        console.error('Failed to initialize game:', err);
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}

export default App;
