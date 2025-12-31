import type { RadicalDrillQuestion } from '../../../types/kanji';

interface RadicalInfoSidebarProps {
  question: RadicalDrillQuestion;
  isAnswered: boolean;
  isDark: boolean;
}

// Radical position names
const POSITION_NAMES: Record<string, { en: string; jp: string; desc: string }> = {
  'hen': { en: 'Left', jp: '偏', desc: 'Appears on the left side' },
  'tsukuri': { en: 'Right', jp: '旁', desc: 'Appears on the right side' },
  'kanmuri': { en: 'Crown', jp: '冠', desc: 'Appears on top' },
  'ashi': { en: 'Legs', jp: '脚', desc: 'Appears at the bottom' },
  'tare': { en: 'Cliff', jp: '垂', desc: 'Appears top-left, going down' },
  'nyou': { en: 'Wrap-left', jp: '繞', desc: 'Wraps from bottom-left' },
  'kamae': { en: 'Enclosure', jp: '構', desc: 'Surrounds other components' },
};

// Question type descriptions
const QUESTION_TYPE_INFO: Record<string, { title: string; desc: string; tip: string }> = {
  'radical_meaning': {
    title: 'Radical Meaning',
    desc: 'Identify what concept this radical represents',
    tip: 'Many radicals represent concrete objects or natural elements',
  },
  'identify_radical': {
    title: 'Radical Identification',
    desc: 'Recognize the radical by its name',
    tip: 'Focus on the distinctive shape of each radical',
  },
  'sound_pattern': {
    title: 'Phonetic Component',
    desc: 'Learn which sound this radical often indicates',
    tip: 'Phonetic radicals appear in many kanji with similar readings',
  },
  'find_kanji': {
    title: 'Find Kanji',
    desc: 'Identify kanji containing this radical',
    tip: 'Look for the radical shape within complex kanji',
  },
  'kanji_components': {
    title: 'Kanji Breakdown',
    desc: 'Analyze the radical components of a kanji',
    tip: 'Most kanji combine a semantic and phonetic component',
  },
};

export function RadicalInfoSidebar({ question, isAnswered, isDark }: RadicalInfoSidebarProps) {
  const radical = question.radical;
  const typeInfo = QUESTION_TYPE_INFO[question.type] || QUESTION_TYPE_INFO['radical_meaning'];
  const positionInfo = radical?.position ? POSITION_NAMES[radical.position] : null;

  // If no radical data, show minimal info
  if (!radical) {
    return (
      <div className={`rounded-2xl p-5 border ${isDark ? 'bg-purple-900/30 border-purple-500/20' : 'bg-purple-50 border-purple-100'}`}>
        <div className="flex items-center gap-2 pb-2">
          <span className="text-xl">📚</span>
          <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Radical Guide</h3>
        </div>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Loading radical info...</p>
      </div>
    );
  }

  const theme = {
    container: isDark
      ? 'bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border-purple-500/20'
      : 'bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 border-purple-100',
    card: isDark
      ? 'bg-white/5 backdrop-blur-sm'
      : 'bg-white/80 backdrop-blur-sm shadow-sm',
    header: isDark ? 'border-purple-500/30' : 'border-purple-200',
    label: isDark ? 'text-purple-400' : 'text-purple-600',
    text: isDark ? 'text-white' : 'text-gray-800',
    textMuted: isDark ? 'text-slate-400' : 'text-gray-600',
    textSubtle: isDark ? 'text-slate-500' : 'text-gray-500',
    badge: isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700',
    badgeAccent: isDark
      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    explanation: isDark
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
  };

  return (
    <div className={`rounded-2xl p-5 space-y-4 border ${theme.container}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 pb-2 border-b ${theme.header}`}>
        <span className="text-xl">📚</span>
        <h3 className={`font-bold ${theme.text}`}>Radical Guide</h3>
      </div>

      {/* Radical Display Card */}
      <div className={`rounded-xl p-4 ${theme.card}`}>
        <div className={`text-xs font-medium uppercase tracking-wide mb-3 ${theme.label}`}>
          Current Radical
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-serif ${theme.text}`}>
            {radical.character}
          </div>
          <div className="flex-1">
            <div className={`font-bold ${theme.text}`}>{radical.nameEn}</div>
            {radical.nameJp && (
              <div className={`text-sm ${theme.textMuted}`}>{radical.nameJp}</div>
            )}
            <div className={`text-xs mt-1 ${theme.textSubtle}`}>
              Radical #{radical.radicalNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Radical Info Card */}
      <div className={`rounded-xl p-4 ${theme.card}`}>
        <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${theme.label}`}>
          Radical Info
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme.badge}`}>
            {radical.strokeCount} stroke{radical.strokeCount !== 1 ? 's' : ''}
          </span>
          {positionInfo && (
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme.badgeAccent}`}>
              {positionInfo.jp} {positionInfo.en}
            </span>
          )}
          {radical.meaning && (
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-700 ${isDark ? 'bg-amber-500/20 text-amber-300' : ''}`}>
              "{radical.meaning}"
            </span>
          )}
        </div>
        {positionInfo && (
          <p className={`text-xs mt-2 ${theme.textSubtle}`}>
            {positionInfo.desc}
          </p>
        )}
      </div>

      {/* Question Type Card */}
      <div className={`rounded-xl p-4 ${theme.card}`}>
        <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${theme.label}`}>
          Question Type
        </div>
        <p className={`font-medium ${theme.text}`}>{typeInfo.title}</p>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>{typeInfo.desc}</p>
      </div>

      {/* Study Tip Card */}
      <div className={`rounded-xl p-4 ${theme.card}`}>
        <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${theme.label}`}>
          💡 Study Tip
        </div>
        <p className={`text-sm ${theme.textMuted}`}>{typeInfo.tip}</p>
      </div>

      {/* Explanation Card - Only show after answering */}
      {isAnswered && question.explanation && (
        <div className={`rounded-xl p-4 border animate-fadeIn ${theme.explanation}`}>
          <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
            ✨ Explanation
          </div>
          <p className={`text-sm leading-relaxed ${theme.text}`}>
            {question.explanation}
          </p>
        </div>
      )}

      {/* Sound Hint - if available */}
      {radical.soundHint && (
        <div className={`rounded-xl p-4 ${theme.card}`}>
          <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${theme.label}`}>
            🔊 Phonetic Hint
          </div>
          <p className={`font-medium ${theme.text}`}>
            Often indicates the sound: <span className="text-pink-500">"{radical.soundHint}"</span>
          </p>
        </div>
      )}

      {/* Difficulty Indicator */}
      <div className="text-center pt-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-white/80 text-gray-600 border-gray-200'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            question.difficulty <= 2 ? 'bg-green-500' :
            question.difficulty <= 3 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></span>
          Level {question.difficulty}
        </span>
      </div>
    </div>
  );
}
