import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

type TimerMode = 'pomodoro' | 'hiit' | 'boxing' | 'cooking' | 'countdown';

interface TimerPreset {
  work: number;
  rest: number;
  rounds?: number;
}

const PRESETS: Record<TimerMode, TimerPreset> = {
  pomodoro: { work: 25 * 60, rest: 5 * 60, rounds: 4 },
  hiit: { work: 30, rest: 10, rounds: 8 },
  boxing: { work: 3 * 60, rest: 60, rounds: 3 },
  cooking: { work: 10 * 60, rest: 0 },
  countdown: { work: 60, rest: 0 },
};

export function TimerWidget() {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(PRESETS.pomodoro.work);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [currentRound, setCurrentRound] = useState(1);
  const [customMinutes, setCustomMinutes] = useState(10);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset timer when mode changes
    const preset = PRESETS[mode];
    setTimeLeft(preset.work);
    setIsRunning(false);
    setIsWorkPhase(true);
    setCurrentRound(1);
  }, [mode]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer completed
          playSound();
          const preset = PRESETS[mode];

          if (mode === 'cooking' || mode === 'countdown') {
            setIsRunning(false);
            return 0;
          }

          // Handle work/rest phases
          if (isWorkPhase) {
            if (preset.rest > 0) {
              setIsWorkPhase(false);
              return preset.rest;
            } else {
              // No rest, move to next round
              if (preset.rounds && currentRound < preset.rounds) {
                setCurrentRound((r) => r + 1);
                return preset.work;
              } else {
                setIsRunning(false);
                return 0;
              }
            }
          } else {
            // Rest phase ended
            if (preset.rounds && currentRound < preset.rounds) {
              setCurrentRound((r) => r + 1);
              setIsWorkPhase(true);
              return preset.work;
            } else {
              setIsRunning(false);
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isWorkPhase, currentRound, mode]);

  const playSound = () => {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (mode === 'countdown' || mode === 'cooking') {
      setTimeLeft(customMinutes * 60);
    }
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    const preset = PRESETS[mode];
    setTimeLeft(preset.work);
    setIsWorkPhase(true);
    setCurrentRound(1);
  };

  const theme = {
    bg: isDark ? 'bg-white/5' : 'bg-white',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
  };

  const modeIcons: Record<TimerMode, string> = {
    pomodoro: '🍅',
    hiit: '💪',
    boxing: '🥊',
    cooking: '🍳',
    countdown: '⏰',
  };

  const modeLabels: Record<TimerMode, string> = {
    pomodoro: 'Pomodoro',
    hiit: 'HIIT',
    boxing: 'Boxing',
    cooking: 'Cooking',
    countdown: 'Countdown',
  };

  const preset = PRESETS[mode];
  const progress = isWorkPhase
    ? ((preset.work - timeLeft) / preset.work) * 100
    : ((preset.rest - timeLeft) / preset.rest) * 100;

  return (
    <div className={`backdrop-blur-xl rounded-2xl border ${theme.bg} ${theme.border} p-4 space-y-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className={`font-bold flex items-center gap-2 ${theme.text}`}>
          <span>{modeIcons[mode]}</span> Timer
        </h3>
        {preset.rounds && (
          <span className={`text-sm ${theme.textMuted}`}>
            Round {currentRound}/{preset.rounds}
          </span>
        )}
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(modeIcons) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`p-2 rounded-lg text-xs font-medium transition-all ${
              mode === m
                ? isDark
                  ? 'bg-purple-500/30 border-2 border-purple-500'
                  : 'bg-purple-100 border-2 border-purple-500'
                : isDark
                  ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                  : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="text-lg">{modeIcons[m]}</div>
          </button>
        ))}
      </div>

      {/* Custom Time Input for Countdown/Cooking */}
      {(mode === 'countdown' || mode === 'cooking') && !isRunning && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max="180"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(Math.max(1, Math.min(180, parseInt(e.target.value) || 1)))}
            className={`w-20 px-3 py-2 rounded-lg border text-center font-mono ${
              isDark
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          />
          <span className={theme.textMuted}>minutes</span>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center">
        <div className={`text-5xl font-mono font-bold mb-2 ${theme.text}`}>
          {formatTime(timeLeft)}
        </div>
        <div className={`text-sm ${theme.textMuted}`}>
          {timeLeft === 0 ? (
            'Time\'s up! 🎉'
          ) : isWorkPhase ? (
            mode === 'pomodoro' ? 'Focus Time' :
            mode === 'hiit' ? 'Work!' :
            mode === 'boxing' ? 'Round Active' :
            mode === 'cooking' ? 'Cooking...' :
            'Counting Down...'
          ) : (
            mode === 'pomodoro' ? 'Break Time' :
            mode === 'hiit' ? 'Rest' :
            'Rest Period'
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className={`mt-4 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div
              className={`h-full transition-all duration-1000 ${
                isWorkPhase
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
          disabled={timeLeft === 0 && !isRunning}
          className={`flex-1 py-2.5 rounded-xl font-bold transition-all ${
            isRunning
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-500/30'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isRunning ? 'Pause' : timeLeft === 0 ? 'Finished' : timeLeft === preset.work && !isRunning ? 'Start' : 'Resume'}
        </button>
        <button
          onClick={handleReset}
          className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
            isDark
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-slate-200 hover:bg-slate-300'
          }`}
        >
          Reset
        </button>
      </div>

      {/* Mode Description */}
      <div className={`text-xs ${theme.textMuted} text-center`}>
        {mode === 'pomodoro' && `${preset.work / 60}min work, ${preset.rest / 60}min break`}
        {mode === 'hiit' && `${preset.work}s work, ${preset.rest}s rest × ${preset.rounds}`}
        {mode === 'boxing' && `${preset.work / 60}min rounds, ${preset.rest}s rest × ${preset.rounds}`}
        {mode === 'cooking' && 'Set your cooking time'}
        {mode === 'countdown' && 'Simple countdown timer'}
      </div>
    </div>
  );
}
