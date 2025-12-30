import type {
  DrillSentence,
  DrillPrompt,
  DrillConjugation,
  MCOption,
  ExampleSentence,
  DrillPracticeMode,
  WordType,
  JLPTLevel,
} from '../types/drill';

export interface DrillQuestion {
  sentence: DrillSentence;
  prompt: DrillPrompt;
  correctAnswer: DrillConjugation;
  mcOptions?: MCOption[];
  practiceMode?: DrillPracticeMode;
  exampleSentence?: ExampleSentence;
}

export interface DrillSessionResponse {
  questions: DrillQuestion[];
}

export interface DrillSessionParams {
  phases: number[];
  jlptLevel: JLPTLevel;
  wordTypes: WordType[];
  count: number;
  practiceMode: DrillPracticeMode;
  bidirectional: boolean;
}

export async function getDrillSession(
  accessToken: string,
  params: DrillSessionParams
): Promise<DrillSessionResponse> {
  const searchParams = new URLSearchParams({
    phases: params.phases.join(','),
    jlptLevel: params.jlptLevel,
    wordTypes: params.wordTypes.join(','),
    count: String(params.count),
    practiceMode: params.practiceMode,
    bidirectional: String(params.bidirectional),
  });

  const response = await fetch(`/api/drill?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch drill session: ${response.statusText}`);
  }

  const data = await response.json();
  return { questions: data.questions || [] };
}

export async function updateUserAccuracy(
  accessToken: string,
  results: Array<{ category: string; correct: boolean }>
): Promise<void> {
  const response = await fetch('/api/drill-accuracy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ results }),
  });

  if (!response.ok) {
    throw new Error('Failed to update accuracy');
  }
}
