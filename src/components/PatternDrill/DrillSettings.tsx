import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { CONJUGATION_PHASES } from '../../types/drill';
import type { DrillSettings as DrillSettingsType, WordType, JLPTLevel } from '../../types/drill';

interface DrillSettingsPanelProps {
  settings: DrillSettingsType;
  onSettingsChange: (settings: DrillSettingsType) => void;
  onStart: () => void;
}

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
    card: isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200',
    toggle: isDark
      ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20'
      : 'bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200',
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
      {/* Answer Mode */}
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

      {/* Practice Mode */}
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

      {/* JLPT Level */}
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

      {/* Word Types */}
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

      {/* Conjugation Phases - Updated with new phases */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Conjugation Phases</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {CONJUGATION_PHASES.map(({ id, name, nameJp, description }) => (
            <button
              key={id}
              onClick={() => togglePhase(id)}
              className={`w-full py-3 px-4 rounded-xl text-left transition-all ${
                settings.selectedPhases.includes(id)
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                  : theme.buttonInactive
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">Phase {id}: {name}</div>
                <div className={`text-sm ${settings.selectedPhases.includes(id) ? 'text-white/70' : theme.textMuted}`}>
                  {nameJp}
                </div>
              </div>
              <div className={`text-sm ${settings.selectedPhases.includes(id) ? 'text-white/80' : theme.textMuted}`}>
                {description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reading Assistance Section - NEW */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Reading Assistance</h3>
        <div className="space-y-3">
          {/* Furigana Toggle */}
          <label
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              settings.showFurigana ? theme.toggle : `${theme.card} hover:border-purple-300`
            }`}
          >
            <input
              type="checkbox"
              checked={settings.showFurigana}
              onChange={(e) => onSettingsChange({ ...settings, showFurigana: e.target.checked })}
              className="w-5 h-5 accent-purple-500 rounded"
            />
            <div className="flex-1">
              <div className={`font-medium ${theme.text}`}>Show Furigana</div>
              <div className={`text-sm ${theme.textMuted}`}>Display readings above kanji (振り仮名)</div>
            </div>
            <div className={`text-2xl ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <ruby>
                漢<rt className="text-xs">かん</rt>
              </ruby>
            </div>
          </label>

          {/* Romaji Toggle */}
          <label
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              settings.showRomaji ? theme.toggle : `${theme.card} hover:border-purple-300`
            }`}
          >
            <input
              type="checkbox"
              checked={settings.showRomaji}
              onChange={(e) => onSettingsChange({ ...settings, showRomaji: e.target.checked })}
              className="w-5 h-5 accent-purple-500 rounded"
            />
            <div className="flex-1">
              <div className={`font-medium ${theme.text}`}>Show Romaji</div>
              <div className={`text-sm ${theme.textMuted}`}>Display romanized readings</div>
            </div>
            <div className={`text-sm font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              taberu
            </div>
          </label>

          {/* Grammar Tips Toggle */}
          <label
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              settings.showGrammarTips ? theme.toggle : `${theme.card} hover:border-purple-300`
            }`}
          >
            <input
              type="checkbox"
              checked={settings.showGrammarTips}
              onChange={(e) => onSettingsChange({ ...settings, showGrammarTips: e.target.checked })}
              className="w-5 h-5 accent-purple-500 rounded"
            />
            <div className="flex-1">
              <div className={`font-medium ${theme.text}`}>Show Grammar Tips</div>
              <div className={`text-sm ${theme.textMuted}`}>Display conjugation hints before answering</div>
            </div>
            <div className={`text-xl ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>
              💡
            </div>
          </label>
        </div>
      </div>

      {/* Questions Slider */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>
          Questions: <span className="text-purple-500">{settings.questionsPerSession}</span>
        </h3>
        <input
          type="range"
          min="5"
          max="30"
          step="5"
          value={settings.questionsPerSession}
          onChange={(e) => onSettingsChange({ ...settings, questionsPerSession: Number(e.target.value) })}
          className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-200'} ${theme.slider}`}
        />
        <div className={`flex justify-between text-xs mt-1 ${theme.textMuted}`}>
          <span>5</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25</span>
          <span>30</span>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        Start Practice
      </button>
    </div>
  );
};
