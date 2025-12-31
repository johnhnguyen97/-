import { useState, useEffect, useCallback } from 'react';
import type { Radical, RadicalDrillType, RadicalDrillQuestion, RadicalDrillSettings, MCOption } from '../../../types/kanji';
import { DEFAULT_RADICAL_DRILL_SETTINGS } from '../../../types/kanji';
import { getAllRadicals } from '../../../services/radicalsApi';
import { RadicalQuestion } from './RadicalQuestion';
import { RadicalSettings } from './RadicalSettings';
import { RadicalProgress } from './RadicalProgress';
import { RadicalResults } from './RadicalResults';

interface RadicalDrillProps {
  isDark: boolean;
}

type DrillState = 'settings' | 'playing' | 'results';

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Create MCOption from text
function createOption(text: string, isCorrect: boolean, subText?: string): MCOption {
  return {
    id: generateId(),
    text,
    isCorrect,
    subText,
  };
}

// Generate questions based on drill type
function generateQuestions(
  radicals: Radical[],
  settings: RadicalDrillSettings
): RadicalDrillQuestion[] {
  const questions: RadicalDrillQuestion[] = [];
  const shuffledRadicals = [...radicals].sort(() => Math.random() - 0.5);
  const count = Math.min(settings.questionsPerSession, radicals.length);

  // Pick random drill types from the settings
  const drillTypes = settings.questionTypes;

  for (let i = 0; i < count; i++) {
    const radical = shuffledRadicals[i];
    const drillType = drillTypes[Math.floor(Math.random() * drillTypes.length)];
    const question = generateQuestion(radical, radicals, drillType, settings.difficulty);
    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

function generateQuestion(
  targetRadical: Radical,
  allRadicals: Radical[],
  drillType: RadicalDrillType,
  difficulty: number
): RadicalDrillQuestion | null {
  switch (drillType) {
    case 'radical_meaning': {
      // Show radical, ask for meaning
      const wrongRadicals = allRadicals
        .filter((r) => r.radicalNumber !== targetRadical.radicalNumber && r.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const correctAnswer = targetRadical.meaning || targetRadical.nameEn;
      const options: MCOption[] = [
        createOption(correctAnswer, true),
        ...wrongRadicals.map((r) => createOption(r.meaning || r.nameEn, false)),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `meaning-${targetRadical.radicalNumber}-${generateId()}`,
        type: 'radical_meaning',
        difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        radical: targetRadical,
        questionText: `What does ${targetRadical.character} mean?`,
        correctAnswer,
        options,
        explanation: `${targetRadical.character} (${targetRadical.nameEn}) means "${correctAnswer}"`,
      };
    }

    case 'identify_radical': {
      // Show radical name, ask to identify the character
      const wrongRadicals = allRadicals
        .filter((r) => r.radicalNumber !== targetRadical.radicalNumber)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const correctAnswer = targetRadical.character;
      const options: MCOption[] = [
        createOption(correctAnswer, true, targetRadical.nameEn),
        ...wrongRadicals.map((r) => createOption(r.character, false, r.nameEn)),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `identify-${targetRadical.radicalNumber}-${generateId()}`,
        type: 'identify_radical',
        difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        radical: targetRadical,
        questionText: `Which is the "${targetRadical.nameEn}" radical?`,
        correctAnswer,
        options,
        explanation: `${targetRadical.character} is the "${targetRadical.nameEn}" radical (#${targetRadical.radicalNumber})`,
      };
    }

    case 'sound_pattern': {
      // Show radical, ask about sound hint
      if (!targetRadical.soundHint) return null;

      const phoneticRadicals = allRadicals.filter((r) => r.soundHint);
      const wrongRadicals = phoneticRadicals
        .filter((r) => r.radicalNumber !== targetRadical.radicalNumber && r.soundHint)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      if (wrongRadicals.length < 3) return null;

      const correctAnswer = targetRadical.soundHint;
      const options: MCOption[] = [
        createOption(correctAnswer, true),
        ...wrongRadicals.map((r) => createOption(r.soundHint!, false)),
      ].sort(() => Math.random() - 0.5);

      return {
        id: `sound-${targetRadical.radicalNumber}-${generateId()}`,
        type: 'sound_pattern',
        difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        radical: targetRadical,
        questionText: `What sound does ${targetRadical.character} often indicate?`,
        correctAnswer,
        options,
        explanation: `${targetRadical.character} (${targetRadical.nameEn}) often indicates the sound "${correctAnswer}"`,
      };
    }

    case 'find_kanji':
    case 'kanji_components':
      // These require kanji data which we don't have in this simple implementation
      // Fall back to radical_meaning
      return generateQuestion(targetRadical, allRadicals, 'radical_meaning', difficulty);

    default:
      return null;
  }
}

export function RadicalDrill({ isDark }: RadicalDrillProps) {
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drillState, setDrillState] = useState<DrillState>('settings');
  const [settings, setSettings] = useState<RadicalDrillSettings>(DEFAULT_RADICAL_DRILL_SETTINGS);

  // Game state
  const [questions, setQuestions] = useState<RadicalDrillQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, { answer: string; isCorrect: boolean }>>(new Map());
  const [showFeedback, setShowFeedback] = useState(false);

  // Load radicals
  useEffect(() => {
    const loadRadicals = async () => {
      try {
        const data = await getAllRadicals();
        setRadicals(data);
      } catch (error) {
        console.error('Failed to load radicals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRadicals();
  }, []);

  const startDrill = useCallback(() => {
    const generatedQuestions = generateQuestions(radicals, settings);
    if (generatedQuestions.length === 0) {
      alert('Could not generate questions for this drill type. Try a different type.');
      return;
    }
    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setAnswers(new Map());
    setShowFeedback(false);
    setDrillState('playing');
  }, [radicals, settings]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      newAnswers.set(currentQuestion.id, { answer, isCorrect });
      return newAnswers;
    });
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setDrillState('results');
    }
  };

  const handleRestart = () => {
    setDrillState('settings');
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers(new Map());
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) : null;

  const theme = {
    container: isDark ? 'text-white' : 'text-gray-800',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full ${
          isDark ? 'border-amber-500' : 'border-amber-600'
        }`} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${theme.container}`}>
      {drillState === 'settings' && (
        <RadicalSettings
          settings={settings}
          onSettingsChange={setSettings}
          onStart={startDrill}
          isDark={isDark}
          maxQuestions={radicals.length}
        />
      )}

      {drillState === 'playing' && currentQuestion && (
        <>
          <RadicalProgress
            current={currentIndex + 1}
            total={questions.length}
            correctCount={Array.from(answers.values()).filter((a) => a.isCorrect).length}
            isDark={isDark}
          />

          <RadicalQuestion
            question={currentQuestion}
            onAnswer={handleAnswer}
            selectedAnswer={currentAnswer?.answer}
            showFeedback={showFeedback}
            onNext={handleNext}
            isDark={isDark}
          />
        </>
      )}

      {drillState === 'results' && (
        <RadicalResults
          questions={questions}
          answers={answers}
          onRestart={handleRestart}
          isDark={isDark}
        />
      )}
    </div>
  );
}
