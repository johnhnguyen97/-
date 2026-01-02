import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { CONJUGATION_PHASES } from '../../types/drill';
import { Toggle, Slider, ChipGroup, Button } from '../../lib/gojun-ui';
import type { DrillSettings as DrillSettingsType, WordType, JLPTLevel } from '../../types/drill';

interface DrillSettingsPanelProps {
  settings: DrillSettingsType;
  onSettingsChange: (settings: DrillSettingsType) => void;
  onStart: () => void;
}

const WORD_TYPE_OPTIONS: { value: WordType; label: string }[] = [
  { value: 'verb', label: 'Verbs' },
  { value: 'adjective', label: 'Adjectives' },
];

const JLPT_OPTIONS: { value: JLPTLevel; label: string }[] = [
  { value: 'N5', label: 'N5' },
  { value: 'N4', label: 'N4' },
  { value: 'N3', label: 'N3' },
  { value: 'N2', label: 'N2' },
  { value: 'N1', label: 'N1' },
];

const ANSWER_MODE_OPTIONS = [
  { value: 'multiple_choice' as const, label: 'Multiple Choice' },
  { value: 'typing' as const, label: 'Typing' },
];

const PRACTICE_MODE_OPTIONS = [
  { value: 'word' as const, label: 'Single Word' },
  { value: 'sentence' as const, label: 'Full Sentence' },
];

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
    card: isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200',
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
        <ChipGroup
          value={settings.mode}
          onChange={(mode) => onSettingsChange({ ...settings, mode })}
          options={ANSWER_MODE_OPTIONS}
          size="lg"
          intent="secondary"
        />
      </div>

      {/* Practice Mode */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Practice Mode</h3>
        <ChipGroup
          value={settings.practiceMode}
          onChange={(practiceMode) => onSettingsChange({ ...settings, practiceMode })}
          options={PRACTICE_MODE_OPTIONS}
          size="lg"
          intent="primary"
        />
      </div>

      {/* JLPT Level */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>JLPT Level</h3>
        <ChipGroup
          value={settings.jlptLevel}
          onChange={(jlptLevel) => onSettingsChange({ ...settings, jlptLevel })}
          options={JLPT_OPTIONS}
          size="md"
          intent="success"
        />
      </div>

      {/* Word Types */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Word Types</h3>
        <div className="flex gap-3">
          {WORD_TYPE_OPTIONS.map(({ value, label }) => (
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

      {/* Conjugation Phases */}
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

      {/* Reading Assistance Section */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>Reading Assistance</h3>
        <div className="space-y-4">
          {/* Furigana Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${theme.card}`}>
            <div className="flex-1">
              <div className={`font-medium ${theme.text}`}>Show Furigana</div>
              <div className={`text-sm ${theme.textMuted}`}>Display readings above kanji (振り仮名)</div>
            </div>
            <Toggle
              checked={settings.showFurigana}
              onChange={(checked) => onSettingsChange({ ...settings, showFurigana: checked })}
              intent="secondary"
            />
          </div>

          {/* Romaji Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${theme.card}`}>
            <div className="flex-1">
              <div className={`font-medium ${theme.text}`}>Show Romaji</div>
              <div className={`text-sm ${theme.textMuted}`}>Display romanized readings</div>
            </div>
            <Toggle
              checked={settings.showRomaji}
              onChange={(checked) => onSettingsChange({ ...settings, showRomaji: checked })}
              intent="secondary"
            />
          </div>

          {/* Grammar Tips Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-xl border ${theme.card}`}>
            <div className="flex-1">
              <div className={`font-medium ${theme.text}`}>Show Grammar Tips</div>
              <div className={`text-sm ${theme.textMuted}`}>Display conjugation hints before answering</div>
            </div>
            <Toggle
              checked={settings.showGrammarTips}
              onChange={(checked) => onSettingsChange({ ...settings, showGrammarTips: checked })}
              intent="primary"
            />
          </div>
        </div>
      </div>

      {/* Questions Slider */}
      <Slider
        label="Questions"
        value={settings.questionsPerSession}
        min={5}
        max={30}
        step={5}
        onChange={(val) => onSettingsChange({ ...settings, questionsPerSession: val })}
        showInput={true}
        showValue={false}
        intent="secondary"
      />

      {/* Start Button */}
      <Button
        onClick={onStart}
        intent="secondary"
        size="xl"
        fullWidth
      >
        Start Practice
      </Button>
    </div>
  );
};
