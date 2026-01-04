import React, { useState } from 'react';
import type { DrillPrompt, DrillSentence, VerbConjugationType, VerbGroup } from '../../types/drill';
import { FORM_DISPLAY_NAMES, VERB_GROUP_NAMES } from '../../types/drill';
import { getConjugationRule } from '../../data/conjugationRules';

interface GrammarSidebarProps {
  prompt: DrillPrompt;
  sentence: DrillSentence;
  isAnswered?: boolean;
  showGrammarTips?: boolean;
}

// Internal verb group type for conjugation rules
type ConjugationVerbGroup = 'ichidan' | 'godan' | 'irregular';

// Map verb group to the key used in conjugation rules
function mapVerbGroupToConjugation(verbGroup: string | null | undefined): ConjugationVerbGroup {
  if (!verbGroup) return 'godan';
  if (verbGroup.includes('1') || verbGroup.toLowerCase().includes('godan')) return 'godan';
  if (verbGroup.includes('2') || verbGroup.toLowerCase().includes('ichidan')) return 'ichidan';
  if (verbGroup.includes('3') || verbGroup.toLowerCase().includes('irregular')) return 'irregular';
  return 'godan';
}

// Map our internal verb group to the VerbGroup type for display names
function mapToVerbGroup(verbGroup: ConjugationVerbGroup): VerbGroup {
  switch (verbGroup) {
    case 'godan': return 'group1';
    case 'ichidan': return 'group2';
    case 'irregular': return 'group3';
    default: return 'group1';
  }
}

// Get display name for verb group
function getVerbGroupDisplayName(verbGroup: ConjugationVerbGroup): string {
  const vg = mapToVerbGroup(verbGroup);
  const names = VERB_GROUP_NAMES[vg];
  return names ? names.short : verbGroup;
}

// Detect irregular verb type from base word
function getIrregularType(baseWord: string): 'suru' | 'kuru' | undefined {
  if (baseWord.endsWith('する') || baseWord === 'する') return 'suru';
  if (baseWord === '来る' || baseWord === 'くる') return 'kuru';
  return undefined;
}

// Get form display name as string
function getFormName(form: string): string {
  const displayName = FORM_DISPLAY_NAMES[form as VerbConjugationType];
  if (displayName && typeof displayName === 'object' && 'en' in displayName) {
    return displayName.en;
  }
  return form;
}

export const GrammarSidebar: React.FC<GrammarSidebarProps> = ({
  prompt,
  sentence,
  isAnswered,
  showGrammarTips = true
}) => {
  const [hintExpanded, setHintExpanded] = useState(false);

  // Get verb group for rule lookup
  const verbGroup = mapVerbGroupToConjugation(sentence.verb_group);
  const irregularType = verbGroup === 'irregular' ? getIrregularType(sentence.japanese_base) : undefined;

  // Get the conjugation rule for the target form
  const conjugationRule = getConjugationRule(
    prompt.to_form as VerbConjugationType,
    verbGroup,
    irregularType
  );

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-5 space-y-4 border border-indigo-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-indigo-200">
        <span className="text-xl">📖</span>
        <h3 className="font-bold text-gray-800">Grammar Guide</h3>
      </div>

      {/* Transformation Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
          Transformation
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
            {getFormName(prompt.from_form)}
          </span>
          <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg text-sm font-medium">
            {getFormName(prompt.to_form)}
          </span>
        </div>
      </div>

      {/* Dictionary Form Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
          Dictionary Form (辞書形)
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold text-gray-800">
            {sentence.dictionary_form || sentence.japanese_base}
          </span>
          {sentence.reading && (
            <span className="text-sm text-gray-500">
              ({sentence.reading})
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-3">
          {sentence.english}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            sentence.word_type === 'verb'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}>
            {sentence.word_type === 'verb' ? '動詞 Verb' : '形容詞 Adjective'}
          </span>
          {sentence.verb_group && (
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              verbGroup === 'ichidan' ? 'bg-emerald-100 text-emerald-700' :
              verbGroup === 'irregular' ? 'bg-amber-100 text-amber-700' :
              'bg-cyan-100 text-cyan-700'
            }`}>
              {getVerbGroupDisplayName(verbGroup)}
            </span>
          )}
          {sentence.adjective_type && (
            <span className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-lg text-sm font-medium">
              {sentence.adjective_type === 'i_adjective' ? 'い-adj' : 'な-adj'}
            </span>
          )}
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
            {sentence.jlpt_level}
          </span>
        </div>
      </div>

      {/* Hint Section - Only show before answering and when enabled */}
      {showGrammarTips && !isAnswered && conjugationRule && conjugationRule.steps && conjugationRule.steps.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-violet-200">
          <button
            onClick={() => setHintExpanded(!hintExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-violet-50/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="font-medium text-violet-700">Need a hint?</span>
            </div>
            <svg
              className={`w-5 h-5 text-violet-400 transition-transform duration-200 ${hintExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {hintExpanded && (
            <div className="px-4 pb-4 space-y-3 animate-fadeInUp">
              {/* Form name */}
              <div className="text-xs font-medium text-violet-600 uppercase tracking-wide">
                {conjugationRule.nameJp || 'Form'} - {conjugationRule.name || 'Conjugation'}
              </div>

              {/* Steps */}
              {conjugationRule.steps && (
                <div className="space-y-2">
                  {conjugationRule.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-violet-100 text-violet-600 rounded-full text-xs font-bold flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Example */}
              {conjugationRule.example && (
                <div className="bg-violet-50 rounded-lg p-3 mt-2">
                  <div className="text-xs font-medium text-violet-500 mb-1">Example</div>
                  <div className="flex items-center gap-2 text-sm">
                    <ruby className="text-gray-700">
                      {conjugationRule.example.dictionary}
                      <rp>(</rp>
                      <rt className="text-xs text-gray-500">{conjugationRule.example.reading}</rt>
                      <rp>)</rp>
                    </ruby>
                    <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <ruby className="text-violet-700 font-medium">
                      {conjugationRule.example.result}
                      <rp>(</rp>
                      <rt className="text-xs text-violet-500">{conjugationRule.example.resultReading}</rt>
                      <rp>)</rp>
                    </ruby>
                  </div>
                </div>
              )}

              {/* Tips */}
              {conjugationRule.tips && conjugationRule.tips.length > 0 && (
                <div className="text-xs text-gray-500 italic mt-2">
                  {conjugationRule.tips.map((tip, index) => (
                    <p key={index} className="flex items-start gap-1">
                      <span>💡</span>
                      <span>{tip}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Prompt Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
          Task
        </div>
        <p className="text-gray-700 font-medium">{prompt.prompt_en}</p>
        <p className="text-gray-500 text-sm mt-1">{prompt.prompt_jp}</p>
      </div>

      {/* Explanation Card - Only show after answering */}
      {isAnswered && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm animate-fadeInUp">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
            💡 How to Form
          </div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {prompt.explanation}
          </p>

          {/* Show full conjugation rule after answering */}
          {conjugationRule && conjugationRule.steps && conjugationRule.steps.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
              <div className="text-xs font-medium text-amber-600">
                {getVerbGroupDisplayName(verbGroup)} Pattern:
              </div>
              <div className="space-y-1">
                {conjugationRule.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-amber-500 font-bold">{index + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase Indicator */}
      <div className="text-center pt-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/80 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"></span>
          Phase {prompt.phase}
        </span>
      </div>
    </div>
  );
};
