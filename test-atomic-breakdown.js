// Automated test suite for atomic grammar breakdown
const testSentences = [
  "I am getting too old for this",
  "I want to eat sushi",
  "The cat is sleeping",
  "I don't want to go",
  "It's too expensive",
  "I have been studying Japanese",
  "Can you help me",
  "This is difficult to understand",
  "I couldn't do it",
  "That was easy to make",
  "I want to try",
  "She is reading a book",
  "I have never been there",
  "It might rain tomorrow",
  "I need to buy groceries",
  "The movie was interesting",
  "I can't speak Japanese well",
  "He always wakes up early",
  "I forgot to bring my wallet",
  "This food tastes good"
];

interface AtomicComponent {
  component: string;
  type: string;
  meaning?: string;
}

interface ValidationIssue {
  sentence: string;
  japanese: string;
  issue: string;
  component: string;
  suggestedBreakdown?: string[];
}

const issues: ValidationIssue[] = [];

// Patterns that indicate improper breakdown
const compoundDetectors = [
  { pattern: /こと$/, name: 'koto nominalizer' },
  { pattern: /には/, name: 'ni-wa compound' },
  { pattern: /[をがにのへとでや]$/, name: 'particle at end' },
  { pattern: /すぎた|すぎる/, name: 'sugiru (too much)' },
  { pattern: /たい|たく/, name: 'tai (want to)' },
  { pattern: /ている|てい/, name: 'te-iru (progressive)' },
  { pattern: /ました|ません/, name: 'masu form' },
  { pattern: /^こんな|^そんな|^あんな/, name: 'konna/sonna/anna' },
];

function analyzeAtomicBreakdown(component: string, type: string, fullJapanese: string): ValidationIssue | null {
  // Check 1: Component contains particle + other stuff
  if (/には|では|とは|へは/.test(component)) {
    return {
      sentence: '',
      japanese: fullJapanese,
      issue: 'Compound particle not separated',
      component: component,
      suggestedBreakdown: component.split(/(?=[はをがにのへとでや])/)
    };
  }

  // Check 2: Component ends with particle but has more before it
  if (component.length > 1 && /[をがにのへとでや]$/.test(component)) {
    const particle = component.slice(-1);
    const base = component.slice(0, -1);
    return {
      sentence: '',
      japanese: fullJapanese,
      issue: 'Particle attached to noun',
      component: component,
      suggestedBreakdown: [base, particle]
    };
  }

  // Check 3: Verb conjugations not broken down
  if (type.includes('verb') || type.includes('auxiliary')) {
    if (/すぎた/.test(component)) {
      return {
        sentence: '',
        japanese: fullJapanese,
        issue: 'すぎた not broken into: verb + すぎ + た',
        component: component,
        suggestedBreakdown: ['[verb]', 'すぎ', 'た']
      };
    }
    if (/すぎる/.test(component)) {
      return {
        sentence: '',
        japanese: fullJapanese,
        issue: 'すぎる not broken into: verb + すぎる',
        component: component,
        suggestedBreakdown: ['[verb]', 'すぎる']
      };
    }
    if (/ている/.test(component) && component !== 'ている') {
      return {
        sentence: '',
        japanese: fullJapanese,
        issue: 'ている not broken into: verb + て + いる',
        component: component,
        suggestedBreakdown: ['[verb]', 'て', 'いる']
      };
    }
    if (/ました/.test(component) && component !== 'ました') {
      return {
        sentence: '',
        japanese: fullJapanese,
        issue: 'ました not broken into: verb + ました',
        component: component,
        suggestedBreakdown: ['[verb]', 'ました']
      };
    }
    if (/たい/.test(component) && component.length > 2) {
      return {
        sentence: '',
        japanese: fullJapanese,
        issue: 'たい not broken into: verb + たい',
        component: component,
        suggestedBreakdown: ['[verb]', 'たい']
      };
    }
  }

  // Check 4: Demonstrative + noun (こんなこと, そんなこと, etc.)
  if (/^こんな|^そんな|^あんな|^どんな/.test(component) && component.length > 3) {
    const demo = component.slice(0, 3);
    const rest = component.slice(3);
    return {
      sentence: '',
      japanese: fullJapanese,
      issue: 'Demonstrative + noun not separated',
      component: component,
      suggestedBreakdown: [demo, rest]
    };
  }

  return null;
}

async function testSentence(sentence: string, apiKey: string, userId: string, token: string) {
  try {
    const response = await fetch('http://localhost:3000/api/translate-sentence', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sentence: sentence,
        parsedWords: []
      })
    });

    if (!response.ok) {
      console.error(`❌ ${sentence}: API error ${response.status}`);
      return;
    }

    const result = await response.json();
    console.log(`\n📝 Testing: "${sentence}"`);
    console.log(`🇯🇵 Japanese: ${result.fullTranslation}`);

    if (!result.grammarNotes || result.grammarNotes.length === 0) {
      console.log('⚠️  No grammar notes');
      return;
    }

    result.grammarNotes.forEach((note: any, noteIdx: number) => {
      if (!note.atomicBreakdown || note.atomicBreakdown.length === 0) {
        return;
      }

      console.log(`\n🔬 Atomic Breakdown (${note.title}):`);
      note.atomicBreakdown.forEach((atom: AtomicComponent, atomIdx: number) => {
        console.log(`  ${atomIdx + 1}. ${atom.component} (${atom.type}) - ${atom.meaning || ''}`);

        const issue = analyzeAtomicBreakdown(atom.component, atom.type, result.fullTranslation);
        if (issue) {
          issue.sentence = sentence;
          issues.push(issue);
          console.log(`     ⚠️  ISSUE: ${issue.issue}`);
          if (issue.suggestedBreakdown) {
            console.log(`     ✅ Should be: ${issue.suggestedBreakdown.join(' + ')}`);
          }
        }
      });
    });

    if (result._validationWarnings && result._validationWarnings.length > 0) {
      console.log('\n⚠️  Backend Validation Warnings:');
      result._validationWarnings.forEach((warning: string) => {
        console.log(`  - ${warning}`);
      });
    }

  } catch (error) {
    console.error(`❌ ${sentence}:`, error);
  }
}

async function runTests() {
  console.log('🚀 Starting Atomic Grammar Breakdown Test Suite\n');
  console.log('This will test the translation API with multiple sentences');
  console.log('and identify patterns where atomic breakdown is failing.\n');
  console.log('='.repeat(60));

  // Note: In real usage, these would come from environment/auth
  const apiKey = process.env.ANTHROPIC_API_KEY || 'test-key';
  const userId = 'test-user';
  const token = 'test-token';

  for (const sentence of testSentences) {
    await testSentence(sentence, apiKey, userId, token);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total issues found: ${issues.length}`);

  if (issues.length > 0) {
    console.log('\n📋 Issues by Category:\n');

    const byCategory: Record<string, ValidationIssue[]> = {};
    issues.forEach(issue => {
      if (!byCategory[issue.issue]) {
        byCategory[issue.issue] = [];
      }
      byCategory[issue.issue].push(issue);
    });

    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category} (${items.length} occurrences):`);
      items.forEach(item => {
        console.log(`  - "${item.component}" in: ${item.sentence}`);
      });
    });

    console.log('\n💡 RECOMMENDATIONS:\n');
    console.log('1. Update AI prompt with more explicit WRONG/CORRECT examples');
    console.log('2. Add post-processing to auto-split common patterns');
    console.log('3. Strengthen backend validation rules');
    console.log('4. Consider using regex-based splitting for particles');
  } else {
    console.log('✅ No issues found! Atomic breakdown is working correctly.');
  }
}

// Export for use in Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testSentences, analyzeAtomicBreakdown };
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests().catch(console.error);
}
