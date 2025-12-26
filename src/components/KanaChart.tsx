import { useState, useEffect } from 'react';

interface KanaChartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KanaChart({ isOpen, onClose }: KanaChartProps) {
  const [activeTab, setActiveTab] = useState<'hiragana' | 'katakana'>('hiragana');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  if (!isOpen) return null;

  const hiraganaChart = [
    { romaji: 'a', kana: 'あ' }, { romaji: 'i', kana: 'い' }, { romaji: 'u', kana: 'う' }, { romaji: 'e', kana: 'え' }, { romaji: 'o', kana: 'お' },
    { romaji: 'ka', kana: 'か' }, { romaji: 'ki', kana: 'き' }, { romaji: 'ku', kana: 'く' }, { romaji: 'ke', kana: 'け' }, { romaji: 'ko', kana: 'こ' },
    { romaji: 'sa', kana: 'さ' }, { romaji: 'shi', kana: 'し' }, { romaji: 'su', kana: 'す' }, { romaji: 'se', kana: 'せ' }, { romaji: 'so', kana: 'そ' },
    { romaji: 'ta', kana: 'た' }, { romaji: 'chi', kana: 'ち' }, { romaji: 'tsu', kana: 'つ' }, { romaji: 'te', kana: 'て' }, { romaji: 'to', kana: 'と' },
    { romaji: 'na', kana: 'な' }, { romaji: 'ni', kana: 'に' }, { romaji: 'nu', kana: 'ぬ' }, { romaji: 'ne', kana: 'ね' }, { romaji: 'no', kana: 'の' },
    { romaji: 'ha', kana: 'は' }, { romaji: 'hi', kana: 'ひ' }, { romaji: 'fu', kana: 'ふ' }, { romaji: 'he', kana: 'へ' }, { romaji: 'ho', kana: 'ほ' },
    { romaji: 'ma', kana: 'ま' }, { romaji: 'mi', kana: 'み' }, { romaji: 'mu', kana: 'む' }, { romaji: 'me', kana: 'め' }, { romaji: 'mo', kana: 'も' },
    { romaji: 'ya', kana: 'や' }, { romaji: '', kana: '' }, { romaji: 'yu', kana: 'ゆ' }, { romaji: '', kana: '' }, { romaji: 'yo', kana: 'よ' },
    { romaji: 'ra', kana: 'ら' }, { romaji: 'ri', kana: 'り' }, { romaji: 'ru', kana: 'る' }, { romaji: 're', kana: 'れ' }, { romaji: 'ro', kana: 'ろ' },
    { romaji: 'wa', kana: 'わ' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: 'wo', kana: 'を' },
    { romaji: 'n', kana: 'ん' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' },
  ];

  const katakanaChart = [
    { romaji: 'a', kana: 'ア' }, { romaji: 'i', kana: 'イ' }, { romaji: 'u', kana: 'ウ' }, { romaji: 'e', kana: 'エ' }, { romaji: 'o', kana: 'オ' },
    { romaji: 'ka', kana: 'カ' }, { romaji: 'ki', kana: 'キ' }, { romaji: 'ku', kana: 'ク' }, { romaji: 'ke', kana: 'ケ' }, { romaji: 'ko', kana: 'コ' },
    { romaji: 'sa', kana: 'サ' }, { romaji: 'shi', kana: 'シ' }, { romaji: 'su', kana: 'ス' }, { romaji: 'se', kana: 'セ' }, { romaji: 'so', kana: 'ソ' },
    { romaji: 'ta', kana: 'タ' }, { romaji: 'chi', kana: 'チ' }, { romaji: 'tsu', kana: 'ツ' }, { romaji: 'te', kana: 'テ' }, { romaji: 'to', kana: 'ト' },
    { romaji: 'na', kana: 'ナ' }, { romaji: 'ni', kana: 'ニ' }, { romaji: 'nu', kana: 'ヌ' }, { romaji: 'ne', kana: 'ネ' }, { romaji: 'no', kana: 'ノ' },
    { romaji: 'ha', kana: 'ハ' }, { romaji: 'hi', kana: 'ヒ' }, { romaji: 'fu', kana: 'フ' }, { romaji: 'he', kana: 'ヘ' }, { romaji: 'ho', kana: 'ホ' },
    { romaji: 'ma', kana: 'マ' }, { romaji: 'mi', kana: 'ミ' }, { romaji: 'mu', kana: 'ム' }, { romaji: 'me', kana: 'メ' }, { romaji: 'mo', kana: 'モ' },
    { romaji: 'ya', kana: 'ヤ' }, { romaji: '', kana: '' }, { romaji: 'yu', kana: 'ユ' }, { romaji: '', kana: '' }, { romaji: 'yo', kana: 'ヨ' },
    { romaji: 'ra', kana: 'ラ' }, { romaji: 'ri', kana: 'リ' }, { romaji: 'ru', kana: 'ル' }, { romaji: 're', kana: 'レ' }, { romaji: 'ro', kana: 'ロ' },
    { romaji: 'wa', kana: 'ワ' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: 'wo', kana: 'ヲ' },
    { romaji: 'n', kana: 'ン' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' }, { romaji: '', kana: '' },
  ];

  const currentChart = activeTab === 'hiragana' ? hiraganaChart : katakanaChart;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all duration-200 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                {activeTab === 'hiragana' ? 'あ' : 'ア'}
              </div>
              <div>
                <h2 className="text-lg font-bold">Kana Chart</h2>
                <p className="text-white/80 text-xs">Japanese syllabary reference</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all hover:rotate-90 duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 bg-white/10 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('hiragana')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'hiragana'
                  ? 'bg-white text-pink-600 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              ひらがな
              <span className="block text-xs opacity-70 mt-0.5">Hiragana</span>
            </button>
            <button
              onClick={() => setActiveTab('katakana')}
              className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'katakana'
                  ? 'bg-white text-pink-600 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              カタカナ
              <span className="block text-xs opacity-70 mt-0.5">Katakana</span>
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)] bg-gradient-to-b from-gray-50 to-white">
          <div className="grid grid-cols-5 gap-2 grid-stagger" key={activeTab}>
            {currentChart.map((item, index) => (
              <div
                key={`${activeTab}-${index}`}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                  item.kana
                    ? 'bg-white border-2 border-gray-100 hover:border-pink-300 hover:shadow-lg hover:scale-105 cursor-pointer group'
                    : ''
                }`}
              >
                {item.kana && (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors">
                      {item.kana}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 group-hover:text-pink-400 transition-colors">
                      {item.romaji}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-pink-100 border border-pink-300"></div>
                <span>Hover to highlight</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">46 characters</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
