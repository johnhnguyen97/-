/**
 * Conjugation Rules Data
 *
 * Step-by-step conjugation rules for each verb group:
 * - Ichidan (一段/Group 2): Drop る, add suffix
 * - Godan (五段/Group 1): Various vowel changes based on ending
 * - Irregular (不規則/Group 3): する and 来る special cases
 */

import type { VerbConjugationType } from '../types/drill';

export interface ConjugationRule {
  name: string;
  nameJp: string;
  steps: string[];
  example: {
    dictionary: string;
    reading: string;
    result: string;
    resultReading: string;
  };
  tips?: string[];
}

export interface VerbGroupRules {
  ichidan: ConjugationRule;
  godan: ConjugationRule;
  irregular?: {
    suru: ConjugationRule;
    kuru: ConjugationRule;
  };
}

// Godan verb endings and their stem changes
export const GODAN_STEM_CHANGES = {
  // Dictionary ending → masu-stem
  'う': 'い',
  'く': 'き',
  'ぐ': 'ぎ',
  'す': 'し',
  'つ': 'ち',
  'ぬ': 'に',
  'ぶ': 'び',
  'む': 'み',
  'る': 'り',
};

// Te-form sound changes for Godan verbs
export const GODAN_TE_FORM_CHANGES = {
  'う': 'って',
  'つ': 'って',
  'る': 'って',
  'む': 'んで',
  'ぶ': 'んで',
  'ぬ': 'んで',
  'く': 'いて',
  'ぐ': 'いで',
  'す': 'して',
};

// A-dan for negative/passive/causative
export const GODAN_A_STEM = {
  'う': 'わ',
  'く': 'か',
  'ぐ': 'が',
  'す': 'さ',
  'つ': 'た',
  'ぬ': 'な',
  'ぶ': 'ば',
  'む': 'ま',
  'る': 'ら',
};

// E-dan for potential/imperative/conditional
export const GODAN_E_STEM = {
  'う': 'え',
  'く': 'け',
  'ぐ': 'げ',
  'す': 'せ',
  'つ': 'て',
  'ぬ': 'ね',
  'ぶ': 'べ',
  'む': 'め',
  'る': 'れ',
};

// O-dan for volitional
export const GODAN_O_STEM = {
  'う': 'お',
  'く': 'こ',
  'ぐ': 'ご',
  'す': 'そ',
  'つ': 'と',
  'ぬ': 'の',
  'ぶ': 'ぼ',
  'む': 'も',
  'る': 'ろ',
};

export const CONJUGATION_RULES: Record<VerbConjugationType, VerbGroupRules> = {
  // ===== Polite (ます) Forms =====
  masu_positive: {
    ichidan: {
      name: 'Polite Present Positive',
      nameJp: 'ます形（肯定）',
      steps: [
        'Remove る from dictionary form',
        'Add ます',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べます',
        resultReading: 'たべます',
      },
      tips: ['All ichidan verbs end in る preceded by an え or い sound'],
    },
    godan: {
      name: 'Polite Present Positive',
      nameJp: 'ます形（肯定）',
      steps: [
        'Find the dictionary ending (う/く/ぐ/す/つ/ぬ/ぶ/む/る)',
        'Change to い-row sound (い/き/ぎ/し/ち/に/び/み/り)',
        'Add ます',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書きます',
        resultReading: 'かきます',
      },
      tips: ['The stem change follows the あいうえお vowel chart'],
    },
    irregular: {
      suru: {
        name: 'Polite Present Positive',
        nameJp: 'ます形（肯定）',
        steps: ['する → します'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'します',
          resultReading: 'します',
        },
      },
      kuru: {
        name: 'Polite Present Positive',
        nameJp: 'ます形（肯定）',
        steps: ['来る → 来ます (くる → きます)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ます',
          resultReading: 'きます',
        },
        tips: ['Note the reading changes from く to き'],
      },
    },
  },

  masu_negative: {
    ichidan: {
      name: 'Polite Present Negative',
      nameJp: 'ます形（否定）',
      steps: [
        'Remove る from dictionary form',
        'Add ません',
      ],
      example: {
        dictionary: '見る',
        reading: 'みる',
        result: '見ません',
        resultReading: 'みません',
      },
    },
    godan: {
      name: 'Polite Present Negative',
      nameJp: 'ます形（否定）',
      steps: [
        'Change dictionary ending to い-row',
        'Add ません',
      ],
      example: {
        dictionary: '読む',
        reading: 'よむ',
        result: '読みません',
        resultReading: 'よみません',
      },
    },
    irregular: {
      suru: {
        name: 'Polite Present Negative',
        nameJp: 'ます形（否定）',
        steps: ['する → しません'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しません',
          resultReading: 'しません',
        },
      },
      kuru: {
        name: 'Polite Present Negative',
        nameJp: 'ます形（否定）',
        steps: ['来る → 来ません (くる → きません)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ません',
          resultReading: 'きません',
        },
      },
    },
  },

  masu_past_positive: {
    ichidan: {
      name: 'Polite Past Positive',
      nameJp: 'ました形（肯定）',
      steps: [
        'Remove る from dictionary form',
        'Add ました',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べました',
        resultReading: 'たべました',
      },
    },
    godan: {
      name: 'Polite Past Positive',
      nameJp: 'ました形（肯定）',
      steps: [
        'Change dictionary ending to い-row',
        'Add ました',
      ],
      example: {
        dictionary: '話す',
        reading: 'はなす',
        result: '話しました',
        resultReading: 'はなしました',
      },
    },
    irregular: {
      suru: {
        name: 'Polite Past Positive',
        nameJp: 'ました形（肯定）',
        steps: ['する → しました'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しました',
          resultReading: 'しました',
        },
      },
      kuru: {
        name: 'Polite Past Positive',
        nameJp: 'ました形（肯定）',
        steps: ['来る → 来ました (くる → きました)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ました',
          resultReading: 'きました',
        },
      },
    },
  },

  masu_past_negative: {
    ichidan: {
      name: 'Polite Past Negative',
      nameJp: 'ませんでした形',
      steps: [
        'Remove る from dictionary form',
        'Add ませんでした',
      ],
      example: {
        dictionary: '見る',
        reading: 'みる',
        result: '見ませんでした',
        resultReading: 'みませんでした',
      },
    },
    godan: {
      name: 'Polite Past Negative',
      nameJp: 'ませんでした形',
      steps: [
        'Change dictionary ending to い-row',
        'Add ませんでした',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行きませんでした',
        resultReading: 'いきませんでした',
      },
    },
    irregular: {
      suru: {
        name: 'Polite Past Negative',
        nameJp: 'ませんでした形',
        steps: ['する → しませんでした'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しませんでした',
          resultReading: 'しませんでした',
        },
      },
      kuru: {
        name: 'Polite Past Negative',
        nameJp: 'ませんでした形',
        steps: ['来る → 来ませんでした'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ませんでした',
          resultReading: 'きませんでした',
        },
      },
    },
  },

  // ===== Plain Forms =====
  plain_positive: {
    ichidan: {
      name: 'Plain Present Positive',
      nameJp: '辞書形',
      steps: ['This is the dictionary form - no change needed'],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べる',
        resultReading: 'たべる',
      },
    },
    godan: {
      name: 'Plain Present Positive',
      nameJp: '辞書形',
      steps: ['This is the dictionary form - no change needed'],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書く',
        resultReading: 'かく',
      },
    },
    irregular: {
      suru: {
        name: 'Plain Present Positive',
        nameJp: '辞書形',
        steps: ['する stays as する'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'する',
          resultReading: 'する',
        },
      },
      kuru: {
        name: 'Plain Present Positive',
        nameJp: '辞書形',
        steps: ['来る stays as 来る'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来る',
          resultReading: 'くる',
        },
      },
    },
  },

  plain_negative: {
    ichidan: {
      name: 'Plain Present Negative',
      nameJp: 'ない形',
      steps: [
        'Remove る from dictionary form',
        'Add ない',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べない',
        resultReading: 'たべない',
      },
    },
    godan: {
      name: 'Plain Present Negative',
      nameJp: 'ない形',
      steps: [
        'Change dictionary ending to あ-row (う→わ, く→か, etc.)',
        'Add ない',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書かない',
        resultReading: 'かかない',
      },
      tips: ['Special: う → わない (not あない)', '行く → 行かない'],
    },
    irregular: {
      suru: {
        name: 'Plain Present Negative',
        nameJp: 'ない形',
        steps: ['する → しない'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しない',
          resultReading: 'しない',
        },
      },
      kuru: {
        name: 'Plain Present Negative',
        nameJp: 'ない形',
        steps: ['来る → 来ない (くる → こない)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ない',
          resultReading: 'こない',
        },
        tips: ['Reading changes from く to こ'],
      },
    },
  },

  plain_past_positive: {
    ichidan: {
      name: 'Plain Past Positive',
      nameJp: 'た形',
      steps: [
        'Remove る from dictionary form',
        'Add た',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べた',
        resultReading: 'たべた',
      },
    },
    godan: {
      name: 'Plain Past Positive',
      nameJp: 'た形',
      steps: [
        'Same sound changes as て-form, but end with た/だ',
        'う/つ/る → った',
        'む/ぶ/ぬ → んだ',
        'く → いた (行く → 行った exception)',
        'ぐ → いだ',
        'す → した',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書いた',
        resultReading: 'かいた',
      },
      tips: ['Exception: 行く → 行った (not 行いた)'],
    },
    irregular: {
      suru: {
        name: 'Plain Past Positive',
        nameJp: 'た形',
        steps: ['する → した'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'した',
          resultReading: 'した',
        },
      },
      kuru: {
        name: 'Plain Past Positive',
        nameJp: 'た形',
        steps: ['来る → 来た (くる → きた)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来た',
          resultReading: 'きた',
        },
      },
    },
  },

  plain_past_negative: {
    ichidan: {
      name: 'Plain Past Negative',
      nameJp: 'なかった形',
      steps: [
        'Remove る from dictionary form',
        'Add なかった',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べなかった',
        resultReading: 'たべなかった',
      },
    },
    godan: {
      name: 'Plain Past Negative',
      nameJp: 'なかった形',
      steps: [
        'Change dictionary ending to あ-row',
        'Add なかった',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書かなかった',
        resultReading: 'かかなかった',
      },
    },
    irregular: {
      suru: {
        name: 'Plain Past Negative',
        nameJp: 'なかった形',
        steps: ['する → しなかった'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しなかった',
          resultReading: 'しなかった',
        },
      },
      kuru: {
        name: 'Plain Past Negative',
        nameJp: 'なかった形',
        steps: ['来る → 来なかった (くる → こなかった)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来なかった',
          resultReading: 'こなかった',
        },
      },
    },
  },

  // ===== Te-form =====
  te_form: {
    ichidan: {
      name: 'Te-form',
      nameJp: 'て形',
      steps: [
        'Remove る from dictionary form',
        'Add て',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べて',
        resultReading: 'たべて',
      },
      tips: ['Te-form is used for requests, connecting actions, and progressive tense'],
    },
    godan: {
      name: 'Te-form',
      nameJp: 'て形',
      steps: [
        'Apply sound change based on ending:',
        'う/つ/る → って',
        'む/ぶ/ぬ → んで',
        'く → いて',
        'ぐ → いで',
        'す → して',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書いて',
        resultReading: 'かいて',
      },
      tips: [
        'Exception: 行く → 行って (not 行いて)',
        'Mnemonic: "って" for う-column, "んで" for nasals, "いて/いで" for く/ぐ',
      ],
    },
    irregular: {
      suru: {
        name: 'Te-form',
        nameJp: 'て形',
        steps: ['する → して'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'して',
          resultReading: 'して',
        },
      },
      kuru: {
        name: 'Te-form',
        nameJp: 'て形',
        steps: ['来る → 来て (くる → きて)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来て',
          resultReading: 'きて',
        },
      },
    },
  },

  te_iru: {
    ichidan: {
      name: 'Progressive/State',
      nameJp: 'ている形',
      steps: [
        'Make て-form',
        'Add いる',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べている',
        resultReading: 'たべている',
      },
      tips: ['Expresses ongoing action or resulting state'],
    },
    godan: {
      name: 'Progressive/State',
      nameJp: 'ている形',
      steps: [
        'Make て-form',
        'Add いる',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書いている',
        resultReading: 'かいている',
      },
    },
    irregular: {
      suru: {
        name: 'Progressive/State',
        nameJp: 'ている形',
        steps: ['する → している'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'している',
          resultReading: 'している',
        },
      },
      kuru: {
        name: 'Progressive/State',
        nameJp: 'ている形',
        steps: ['来る → 来ている'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ている',
          resultReading: 'きている',
        },
      },
    },
  },

  // ===== Desire Forms (たい) =====
  tai_form: {
    ichidan: {
      name: 'Want to (Desire)',
      nameJp: 'たい形',
      steps: [
        'Remove る from dictionary form',
        'Add たい',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べたい',
        resultReading: 'たべたい',
      },
      tips: ['Only used for first person (I want to...) or questions (Do you want to...?)'],
    },
    godan: {
      name: 'Want to (Desire)',
      nameJp: 'たい形',
      steps: [
        'Change dictionary ending to い-row',
        'Add たい',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書きたい',
        resultReading: 'かきたい',
      },
    },
    irregular: {
      suru: {
        name: 'Want to (Desire)',
        nameJp: 'たい形',
        steps: ['する → したい'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'したい',
          resultReading: 'したい',
        },
      },
      kuru: {
        name: 'Want to (Desire)',
        nameJp: 'たい形',
        steps: ['来る → 来たい'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来たい',
          resultReading: 'きたい',
        },
      },
    },
  },

  tai_negative: {
    ichidan: {
      name: 'Don\'t want to',
      nameJp: 'たくない形',
      steps: [
        'Remove る from dictionary form',
        'Add たくない',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べたくない',
        resultReading: 'たべたくない',
      },
    },
    godan: {
      name: 'Don\'t want to',
      nameJp: 'たくない形',
      steps: [
        'Change dictionary ending to い-row',
        'Add たくない',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行きたくない',
        resultReading: 'いきたくない',
      },
    },
    irregular: {
      suru: {
        name: 'Don\'t want to',
        nameJp: 'たくない形',
        steps: ['する → したくない'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'したくない',
          resultReading: 'したくない',
        },
      },
      kuru: {
        name: 'Don\'t want to',
        nameJp: 'たくない形',
        steps: ['来る → 来たくない'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来たくない',
          resultReading: 'きたくない',
        },
      },
    },
  },

  tai_past: {
    ichidan: {
      name: 'Wanted to',
      nameJp: 'たかった形',
      steps: [
        'Remove る from dictionary form',
        'Add たかった',
      ],
      example: {
        dictionary: '見る',
        reading: 'みる',
        result: '見たかった',
        resultReading: 'みたかった',
      },
    },
    godan: {
      name: 'Wanted to',
      nameJp: 'たかった形',
      steps: [
        'Change dictionary ending to い-row',
        'Add たかった',
      ],
      example: {
        dictionary: '買う',
        reading: 'かう',
        result: '買いたかった',
        resultReading: 'かいたかった',
      },
    },
    irregular: {
      suru: {
        name: 'Wanted to',
        nameJp: 'たかった形',
        steps: ['する → したかった'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'したかった',
          resultReading: 'したかった',
        },
      },
      kuru: {
        name: 'Wanted to',
        nameJp: 'たかった形',
        steps: ['来る → 来たかった'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来たかった',
          resultReading: 'きたかった',
        },
      },
    },
  },

  // ===== Potential Forms =====
  potential_positive: {
    ichidan: {
      name: 'Potential (Can do)',
      nameJp: '可能形（肯定）',
      steps: [
        'Remove る from dictionary form',
        'Add られる (or れる in casual speech)',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べられる',
        resultReading: 'たべられる',
      },
      tips: ['Colloquially, 食べれる (ra-nuki) is common but grammatically incorrect'],
    },
    godan: {
      name: 'Potential (Can do)',
      nameJp: '可能形（肯定）',
      steps: [
        'Change dictionary ending to え-row',
        'Add る',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書ける',
        resultReading: 'かける',
      },
    },
    irregular: {
      suru: {
        name: 'Potential (Can do)',
        nameJp: '可能形（肯定）',
        steps: ['する → できる'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'できる',
          resultReading: 'できる',
        },
        tips: ['Uses a completely different verb (できる)'],
      },
      kuru: {
        name: 'Potential (Can do)',
        nameJp: '可能形（肯定）',
        steps: ['来る → 来られる (くる → こられる)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来られる',
          resultReading: 'こられる',
        },
      },
    },
  },

  potential_negative: {
    ichidan: {
      name: 'Potential Negative',
      nameJp: '可能形（否定）',
      steps: [
        'Remove る from dictionary form',
        'Add られない',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べられない',
        resultReading: 'たべられない',
      },
    },
    godan: {
      name: 'Potential Negative',
      nameJp: '可能形（否定）',
      steps: [
        'Change dictionary ending to え-row',
        'Add ない',
      ],
      example: {
        dictionary: '読む',
        reading: 'よむ',
        result: '読めない',
        resultReading: 'よめない',
      },
    },
    irregular: {
      suru: {
        name: 'Potential Negative',
        nameJp: '可能形（否定）',
        steps: ['する → できない'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'できない',
          resultReading: 'できない',
        },
      },
      kuru: {
        name: 'Potential Negative',
        nameJp: '可能形（否定）',
        steps: ['来る → 来られない'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来られない',
          resultReading: 'こられない',
        },
      },
    },
  },

  // ===== Volitional Forms =====
  volitional: {
    ichidan: {
      name: 'Volitional (Let\'s)',
      nameJp: '意志形',
      steps: [
        'Remove る from dictionary form',
        'Add よう',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べよう',
        resultReading: 'たべよう',
      },
      tips: ['Used for suggestions, intentions, and "let\'s..." expressions'],
    },
    godan: {
      name: 'Volitional (Let\'s)',
      nameJp: '意志形',
      steps: [
        'Change dictionary ending to お-row',
        'Add う',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行こう',
        resultReading: 'いこう',
      },
    },
    irregular: {
      suru: {
        name: 'Volitional (Let\'s)',
        nameJp: '意志形',
        steps: ['する → しよう'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しよう',
          resultReading: 'しよう',
        },
      },
      kuru: {
        name: 'Volitional (Let\'s)',
        nameJp: '意志形',
        steps: ['来る → 来よう (くる → こよう)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来よう',
          resultReading: 'こよう',
        },
      },
    },
  },

  volitional_polite: {
    ichidan: {
      name: 'Polite Volitional',
      nameJp: 'ましょう形',
      steps: [
        'Remove る from dictionary form',
        'Add ましょう',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べましょう',
        resultReading: 'たべましょう',
      },
    },
    godan: {
      name: 'Polite Volitional',
      nameJp: 'ましょう形',
      steps: [
        'Change dictionary ending to い-row',
        'Add ましょう',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行きましょう',
        resultReading: 'いきましょう',
      },
    },
    irregular: {
      suru: {
        name: 'Polite Volitional',
        nameJp: 'ましょう形',
        steps: ['する → しましょう'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しましょう',
          resultReading: 'しましょう',
        },
      },
      kuru: {
        name: 'Polite Volitional',
        nameJp: 'ましょう形',
        steps: ['来る → 来ましょう'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ましょう',
          resultReading: 'きましょう',
        },
      },
    },
  },

  // ===== Imperative Forms =====
  imperative: {
    ichidan: {
      name: 'Imperative (Command)',
      nameJp: '命令形',
      steps: [
        'Remove る from dictionary form',
        'Add ろ (casual) or なさい (softer)',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べろ',
        resultReading: 'たべろ',
      },
      tips: ['Very direct/rude in most contexts. Use て + ください for polite requests'],
    },
    godan: {
      name: 'Imperative (Command)',
      nameJp: '命令形',
      steps: [
        'Change dictionary ending to え-row',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書け',
        resultReading: 'かけ',
      },
    },
    irregular: {
      suru: {
        name: 'Imperative (Command)',
        nameJp: '命令形',
        steps: ['する → しろ'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'しろ',
          resultReading: 'しろ',
        },
      },
      kuru: {
        name: 'Imperative (Command)',
        nameJp: '命令形',
        steps: ['来る → 来い (くる → こい)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来い',
          resultReading: 'こい',
        },
      },
    },
  },

  imperative_negative: {
    ichidan: {
      name: 'Negative Imperative (Don\'t)',
      nameJp: '禁止形',
      steps: [
        'Keep dictionary form',
        'Add な',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べるな',
        resultReading: 'たべるな',
      },
      tips: ['Strong prohibition. Use ないでください for polite requests'],
    },
    godan: {
      name: 'Negative Imperative (Don\'t)',
      nameJp: '禁止形',
      steps: [
        'Keep dictionary form',
        'Add な',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行くな',
        resultReading: 'いくな',
      },
    },
    irregular: {
      suru: {
        name: 'Negative Imperative (Don\'t)',
        nameJp: '禁止形',
        steps: ['する → するな'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'するな',
          resultReading: 'するな',
        },
      },
      kuru: {
        name: 'Negative Imperative (Don\'t)',
        nameJp: '禁止形',
        steps: ['来る → 来るな (くる → くるな)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来るな',
          resultReading: 'くるな',
        },
      },
    },
  },

  // ===== Passive Forms =====
  passive_positive: {
    ichidan: {
      name: 'Passive',
      nameJp: '受身形（肯定）',
      steps: [
        'Remove る from dictionary form',
        'Add られる',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べられる',
        resultReading: 'たべられる',
      },
      tips: ['Same form as potential for ichidan verbs - context determines meaning'],
    },
    godan: {
      name: 'Passive',
      nameJp: '受身形（肯定）',
      steps: [
        'Change dictionary ending to あ-row',
        'Add れる',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書かれる',
        resultReading: 'かかれる',
      },
    },
    irregular: {
      suru: {
        name: 'Passive',
        nameJp: '受身形（肯定）',
        steps: ['する → される'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'される',
          resultReading: 'される',
        },
      },
      kuru: {
        name: 'Passive',
        nameJp: '受身形（肯定）',
        steps: ['来る → 来られる'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来られる',
          resultReading: 'こられる',
        },
      },
    },
  },

  passive_negative: {
    ichidan: {
      name: 'Passive Negative',
      nameJp: '受身形（否定）',
      steps: [
        'Remove る from dictionary form',
        'Add られない',
      ],
      example: {
        dictionary: '見る',
        reading: 'みる',
        result: '見られない',
        resultReading: 'みられない',
      },
    },
    godan: {
      name: 'Passive Negative',
      nameJp: '受身形（否定）',
      steps: [
        'Change dictionary ending to あ-row',
        'Add れない',
      ],
      example: {
        dictionary: '読む',
        reading: 'よむ',
        result: '読まれない',
        resultReading: 'よまれない',
      },
    },
    irregular: {
      suru: {
        name: 'Passive Negative',
        nameJp: '受身形（否定）',
        steps: ['する → されない'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'されない',
          resultReading: 'されない',
        },
      },
      kuru: {
        name: 'Passive Negative',
        nameJp: '受身形（否定）',
        steps: ['来る → 来られない'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来られない',
          resultReading: 'こられない',
        },
      },
    },
  },

  // ===== Causative Forms =====
  causative_positive: {
    ichidan: {
      name: 'Causative (Make/Let)',
      nameJp: '使役形（肯定）',
      steps: [
        'Remove る from dictionary form',
        'Add させる',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べさせる',
        resultReading: 'たべさせる',
      },
      tips: ['Can mean "make someone do" or "let someone do" depending on context'],
    },
    godan: {
      name: 'Causative (Make/Let)',
      nameJp: '使役形（肯定）',
      steps: [
        'Change dictionary ending to あ-row',
        'Add せる',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書かせる',
        resultReading: 'かかせる',
      },
    },
    irregular: {
      suru: {
        name: 'Causative (Make/Let)',
        nameJp: '使役形（肯定）',
        steps: ['する → させる'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'させる',
          resultReading: 'させる',
        },
      },
      kuru: {
        name: 'Causative (Make/Let)',
        nameJp: '使役形（肯定）',
        steps: ['来る → 来させる'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来させる',
          resultReading: 'こさせる',
        },
      },
    },
  },

  causative_negative: {
    ichidan: {
      name: 'Causative Negative',
      nameJp: '使役形（否定）',
      steps: [
        'Remove る from dictionary form',
        'Add させない',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べさせない',
        resultReading: 'たべさせない',
      },
    },
    godan: {
      name: 'Causative Negative',
      nameJp: '使役形（否定）',
      steps: [
        'Change dictionary ending to あ-row',
        'Add せない',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行かせない',
        resultReading: 'いかせない',
      },
    },
    irregular: {
      suru: {
        name: 'Causative Negative',
        nameJp: '使役形（否定）',
        steps: ['する → させない'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'させない',
          resultReading: 'させない',
        },
      },
      kuru: {
        name: 'Causative Negative',
        nameJp: '使役形（否定）',
        steps: ['来る → 来させない'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来させない',
          resultReading: 'こさせない',
        },
      },
    },
  },

  causative_passive: {
    ichidan: {
      name: 'Causative-Passive',
      nameJp: '使役受身形',
      steps: [
        'Remove る from dictionary form',
        'Add させられる',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べさせられる',
        resultReading: 'たべさせられる',
      },
      tips: ['Means "to be made to do" - often implies reluctance'],
    },
    godan: {
      name: 'Causative-Passive',
      nameJp: '使役受身形',
      steps: [
        'Change dictionary ending to あ-row',
        'Add せられる (or shorter される)',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書かせられる',
        resultReading: 'かかせられる',
      },
      tips: ['Shortened form: 書かされる is common in speech'],
    },
    irregular: {
      suru: {
        name: 'Causative-Passive',
        nameJp: '使役受身形',
        steps: ['する → させられる'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'させられる',
          resultReading: 'させられる',
        },
      },
      kuru: {
        name: 'Causative-Passive',
        nameJp: '使役受身形',
        steps: ['来る → 来させられる'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来させられる',
          resultReading: 'こさせられる',
        },
      },
    },
  },

  // ===== Conditional Forms =====
  conditional_ba: {
    ichidan: {
      name: 'Conditional (ば)',
      nameJp: '仮定形（ば）',
      steps: [
        'Remove る from dictionary form',
        'Add れば',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べれば',
        resultReading: 'たべれば',
      },
      tips: ['Expresses "if" condition - often for hypothetical or general truths'],
    },
    godan: {
      name: 'Conditional (ば)',
      nameJp: '仮定形（ば）',
      steps: [
        'Change dictionary ending to え-row',
        'Add ば',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書けば',
        resultReading: 'かけば',
      },
    },
    irregular: {
      suru: {
        name: 'Conditional (ば)',
        nameJp: '仮定形（ば）',
        steps: ['する → すれば'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'すれば',
          resultReading: 'すれば',
        },
      },
      kuru: {
        name: 'Conditional (ば)',
        nameJp: '仮定形（ば）',
        steps: ['来る → 来れば (くる → くれば)'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来れば',
          resultReading: 'くれば',
        },
      },
    },
  },

  conditional_tara: {
    ichidan: {
      name: 'Conditional (たら)',
      nameJp: '仮定形（たら）',
      steps: [
        'Make た-form',
        'Add ら',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べたら',
        resultReading: 'たべたら',
      },
      tips: ['More versatile than ば - can express "when" as well as "if"'],
    },
    godan: {
      name: 'Conditional (たら)',
      nameJp: '仮定形（たら）',
      steps: [
        'Make た-form',
        'Add ら',
      ],
      example: {
        dictionary: '書く',
        reading: 'かく',
        result: '書いたら',
        resultReading: 'かいたら',
      },
    },
    irregular: {
      suru: {
        name: 'Conditional (たら)',
        nameJp: '仮定形（たら）',
        steps: ['する → したら'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'したら',
          resultReading: 'したら',
        },
      },
      kuru: {
        name: 'Conditional (たら)',
        nameJp: '仮定形（たら）',
        steps: ['来る → 来たら'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来たら',
          resultReading: 'きたら',
        },
      },
    },
  },

  conditional_to: {
    ichidan: {
      name: 'Conditional (と)',
      nameJp: '仮定形（と）',
      steps: [
        'Keep dictionary form',
        'Add と',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べると',
        resultReading: 'たべると',
      },
      tips: ['Expresses natural/automatic consequences - "whenever X, Y happens"'],
    },
    godan: {
      name: 'Conditional (と)',
      nameJp: '仮定形（と）',
      steps: [
        'Keep dictionary form',
        'Add と',
      ],
      example: {
        dictionary: '押す',
        reading: 'おす',
        result: '押すと',
        resultReading: 'おすと',
      },
    },
    irregular: {
      suru: {
        name: 'Conditional (と)',
        nameJp: '仮定形（と）',
        steps: ['する → すると'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'すると',
          resultReading: 'すると',
        },
      },
      kuru: {
        name: 'Conditional (と)',
        nameJp: '仮定形（と）',
        steps: ['来る → 来ると'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来ると',
          resultReading: 'くると',
        },
      },
    },
  },

  conditional_nara: {
    ichidan: {
      name: 'Conditional (なら)',
      nameJp: '仮定形（なら）',
      steps: [
        'Keep dictionary form (or any form)',
        'Add なら',
      ],
      example: {
        dictionary: '食べる',
        reading: 'たべる',
        result: '食べるなら',
        resultReading: 'たべるなら',
      },
      tips: ['Focuses on the topic/situation - "if it\'s the case that..."'],
    },
    godan: {
      name: 'Conditional (なら)',
      nameJp: '仮定形（なら）',
      steps: [
        'Keep dictionary form',
        'Add なら',
      ],
      example: {
        dictionary: '行く',
        reading: 'いく',
        result: '行くなら',
        resultReading: 'いくなら',
      },
    },
    irregular: {
      suru: {
        name: 'Conditional (なら)',
        nameJp: '仮定形（なら）',
        steps: ['する → するなら'],
        example: {
          dictionary: 'する',
          reading: 'する',
          result: 'するなら',
          resultReading: 'するなら',
        },
      },
      kuru: {
        name: 'Conditional (なら)',
        nameJp: '仮定形（なら）',
        steps: ['来る → 来るなら'],
        example: {
          dictionary: '来る',
          reading: 'くる',
          result: '来るなら',
          resultReading: 'くるなら',
        },
      },
    },
  },
};

/**
 * Get conjugation rule for a specific form and verb group
 */
export function getConjugationRule(
  form: VerbConjugationType,
  verbGroup: 'ichidan' | 'godan' | 'irregular',
  irregularType?: 'suru' | 'kuru'
): ConjugationRule | undefined {
  const rules = CONJUGATION_RULES[form];
  if (!rules) return undefined;

  if (verbGroup === 'irregular' && rules.irregular && irregularType) {
    return rules.irregular[irregularType];
  }

  return rules[verbGroup as 'ichidan' | 'godan'];
}

/**
 * Get all conjugation rules for a specific form
 */
export function getAllRulesForForm(form: VerbConjugationType): VerbGroupRules | undefined {
  return CONJUGATION_RULES[form];
}
