import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { DrillSettings as DrillSettingsType, WordType, JLPTLevel } from '../../types/drill';

interface DrillSettingsPanelProps {
  settings: DrillSettingsType;
  onSettingsChange: (settings: DrillSettingsType) => void;
  onStart: () => void;
}

const PHASES = [
  { value: 1, label: 'Phase 1: Basic Forms', description: 'Present, Past, Negative' },
  { value: 2, label: 'Phase 2: Intermediate', description: 'Te-form, Tai-form' },
  { value: 3, label: 'Phase 3: Advanced', description: 'Potential, Causative, Passive' },
];

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: 'verb', label: 'Verbs' },
  { value: 'adjective', label: 'Adjectives' },
];

const JLPT_LEVELS: JLPTLevel[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const DrillSettingsPanel: React.FC<DrillSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  onStart,
}) => {
  const { isDark } = useTheme();

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    buttonInactive: isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    slider: isDark ? 'accent-purple-500' : 'accent-violet-500',
  };

  const togglePhase = (phase: number) => {
    const newPhases = settings.selectedPhases.includes(phase)
      ? settings.selectedPhases.filter((p) => p !== phase)
      : [...settings.selectedPhases, phase];
    if (newPhases.length > 0) {
      onSettingsChange({ ...settings, selectedPhases: newPhases });
    }
  };

  const toggleWordType = (type: WordType) => {
    const newTypes = settings.selectedWordTypes.includes(type)
      ? settings.selectedWordTypes.filter((t) => t !== type)
      : [...settings.selectedWordTypes, type];
    if (newTypes.length > 0) {
      onSettingsChange({ ...settings, selectedWordTypes: newTypes });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Answer Mode</h3>
        <div className="flex gap-3">
          <button
            onClick={() => onSettingsChange({ ...settings, mode: 'multiple_choice' })}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              settings.mode === 'multiple_choice'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                : theme.buttonInactive
            }`}
          >
            Multiple Choice
          </button>
          <button
            onClick={() => onSettingsChange({ ...settings, mode: 'typing' })}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              settings.mode === 'typing'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                : theme.buttonInactive
            }`}
          >
            Typing
          </button>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Practice Mode</h3>
        <div className="flex gap-3">
          <button
            onClick={() => onSettingsChange({ ...settings, practiceMode: 'word' })}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              settings.practiceMode === 'word'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : theme.buttonInactive
            }`}
          >
            Single Word
          </button>
          <button
            onClick={() => onSettingsChange({ ...settings, practiceMode: 'sentence' })}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
              settings.practiceMode === 'sentence'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : theme.buttonInactive
            }`}
          >
            Full Sentence
          </button>
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>JLPT Level</h3>
        <div className="flex gap-2">
          {JLPT_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => onSettingsChange({ ...settings, jlptLevel: level })}
              className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                settings.jlptLevel === level
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : theme.buttonInactive
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Word Types</h3>
        <div className="flex gap-3">
          {WORD_TYPES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => toggleWordType(value)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                settings.selectedWordTypes.includes(value)
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : theme.buttonInactive
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Conjugation Phases</h3>
        <div className="space-y-2">
          {PHASES.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => togglePhase(value)}
              className={`w-full py-3 px-4 rounded-xl text-left transition-all ${
                settings.selectedPhases.includes(value)
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                  : theme.buttonInactive
              }`}
            >
              <div className="font-medium">{label}</div>
              <div className={`text-sm ${settings.selectedPhases.includes(value) ? 'text-white/80' : theme.textMuted}`}>
                {description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Questions: {settings.questionsPerSession}</h3>
        <input
          type="range"
          min="5"
          max="30"
          step="5"
          value={settings.questionsPerSession}
          onChange={(e) => onSettingsChange({ ...settings, questionsPerSession: Number(e.target.value) })}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${theme.slider}`}
        />
      </div>

      <button
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Start Practice
      </button>
    </div>
  );
};
