import type { RadicalDrillSettings, RadicalDrillType } from '../../../types/kanji';
import { getDrillTypeLabel } from '../../../types/kanji';

interface RadicalSettingsProps {
  settings: RadicalDrillSettings;
  onSettingsChange: (settings: RadicalDrillSettings) => void;
  onStart: () => void;
  isDark: boolean;
  maxQuestions: number;
}

const DRILL_TYPES: { id: RadicalDrillType; label: string; description: string; icon: string }[] = [
  {
    id: 'radical_meaning',
    label: 'Radical Meanings',
    description: 'Learn what each radical means',
    icon: '📖',
  },
  {
    id: 'identify_radical',
    label: 'Identify Radicals',
    description: 'Match radicals to their names',
    icon: '🔍',
  },
  {
    id: 'sound_pattern',
    label: 'Sound Patterns',
    description: 'Connect radicals to their phonetic hints',
    icon: '🔊',
  },
  {
    id: 'find_kanji',
    label: 'Find Kanji',
    description: 'Identify kanji containing a radical',
    icon: '🔎',
  },
  {
    id: 'kanji_components',
    label: 'Kanji Components',
    description: 'Break down kanji into components',
    icon: '🧩',
  },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 30];

export function RadicalSettings({
  settings,
  onSettingsChange,
  onStart,
  isDark,
  maxQuestions,
}: RadicalSettingsProps) {
  const theme = {
    card: isDark
      ? 'bg-white/5 border-white/10 hover:border-amber-500/30'
      : 'bg-white border-stone-200 hover:border-amber-300',
    cardActive: isDark
      ? 'bg-amber-600/20 border-amber-500/50 ring-2 ring-amber-500/30'
      : 'bg-amber-50 border-amber-400 ring-2 ring-amber-200',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    chip: (active: boolean) =>
      active
        ? isDark
          ? 'bg-amber-600/20 text-amber-400 border-amber-500/50'
          : 'bg-amber-100 text-amber-700 border-amber-300'
        : isDark
          ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
          : 'bg-gray-100 text-gray-600 border-stone-200 hover:bg-gray-200',
    button: isDark
      ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white',
  };

  const toggleDrillType = (typeId: RadicalDrillType) => {
    const currentTypes = settings.questionTypes;
    const isSelected = currentTypes.includes(typeId);

    let newTypes: RadicalDrillType[];
    if (isSelected) {
      // Don't allow removing the last type
      if (currentTypes.length === 1) return;
      newTypes = currentTypes.filter((t) => t !== typeId);
    } else {
      newTypes = [...currentTypes, typeId];
    }

    onSettingsChange({ ...settings, questionTypes: newTypes });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-3">🎮</div>
        <h2 className={`text-2xl font-bold ${theme.text}`}>Radical Practice</h2>
        <p className={`mt-2 ${theme.textMuted}`}>
          Master the 214 Kangxi radicals through focused drills
        </p>
      </div>

      {/* Drill Type Selection (multi-select) */}
      <div>
        <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textMuted}`}>
          Choose Drill Types (select one or more)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {DRILL_TYPES.map((type) => {
            const isSelected = settings.questionTypes.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => toggleDrillType(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected ? theme.cardActive : theme.card
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${theme.text}`}>{type.label}</span>
                      {isSelected && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-200 text-amber-800'}`}>
                          ✓
                        </span>
                      )}
                    </div>
                    <div className={`text-sm ${theme.textMuted}`}>{type.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className={`mt-2 text-xs ${theme.textMuted}`}>
          Selected: {settings.questionTypes.map(getDrillTypeLabel).join(', ')}
        </p>
      </div>

      {/* Question Count */}
      <div>
        <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textMuted}`}>
          Number of Questions
        </h3>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.filter((n) => n <= maxQuestions).map((count) => (
            <button
              key={count}
              onClick={() => onSettingsChange({ ...settings, questionsPerSession: count })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${theme.chip(settings.questionsPerSession === count)}`}
            >
              {count} questions
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textMuted}`}>
          Difficulty
        </h3>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => onSettingsChange({ ...settings, difficulty: level as 1 | 2 | 3 | 4 | 5 })}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${theme.chip(settings.difficulty === level)}`}
            >
              {'⭐'.repeat(level)}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <h3 className={`text-sm font-medium uppercase tracking-wide mb-3 ${theme.textMuted}`}>
          Answer Mode
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => onSettingsChange({ ...settings, mode: 'multiple_choice' })}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${theme.chip(settings.mode === 'multiple_choice')}`}
          >
            📋 Multiple Choice
          </button>
          <button
            onClick={() => onSettingsChange({ ...settings, mode: 'typing' })}
            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${theme.chip(settings.mode === 'typing')}`}
          >
            ⌨️ Typing
          </button>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${theme.button}`}
      >
        Start Practice
      </button>
    </div>
  );
}
