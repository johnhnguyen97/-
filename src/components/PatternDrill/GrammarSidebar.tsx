import React from 'react';
import type { DrillPrompt, DrillSentence } from '../../types/drill';

interface GrammarSidebarProps {
  prompt: DrillPrompt;
  sentence: DrillSentence;
  isAnswered?: boolean;
}

// Human-readable form names
const FORM_NAMES: Record<string, string> = {
  'present_positive': 'Present (ます)',
  'present_negative': 'Present Negative (ません)',
  'past_positive': 'Past (ました)',
  'past_negative': 'Past Negative (ませんでした)',
  'te_form': 'Te-form (て)',
  'tai_form': 'Want to (~たい)',
  'potential': 'Potential (can do)',
  'causative': 'Causative (make/let)',
  'passive': 'Passive',
  'conditional': 'Conditional (~ば)',
  'volitional': 'Volitional (~よう)',
};

const getFormName = (form: string): string => FORM_NAMES[form] || form;

export const GrammarSidebar: React.FC<GrammarSidebarProps> = ({ prompt, sentence, isAnswered }) => {
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

      {/* Word Info Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
        <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-2">
          Word Info
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
            <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium">
              Group {sentence.verb_group.replace('group', '')}
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
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 shadow-sm animate-fadeIn">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-2">
            💡 How to Form
          </div>
          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
            {prompt.explanation}
          </p>
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
