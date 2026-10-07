import type { AnswerInput, Question } from '@/models';

/** Matching: up to one wrong attempt still counts as understood. */
export const MATCHING_MISTAKE_ALLOWANCE = 1;

export function evaluateAnswer(question: Question, input: AnswerInput): boolean {
  switch (question.type) {
    case 'multipleChoice':
      return input.type === 'option' && input.optionId === question.correctOptionId;
    case 'trueFalse':
      return input.type === 'boolean' && input.value === question.correct;
    case 'ordering':
      return (
        input.type === 'order' &&
        input.ids.length === question.items.length &&
        input.ids.every((id, i) => id === question.items[i].id)
      );
    case 'matching':
      return input.type === 'pairs' && input.mistakes <= MATCHING_MISTAKE_ALLOWANCE;
  }
}

export interface QuizScore {
  correct: number;
  total: number;
  /** 0..100 */
  percent: number;
}

export function scoreQuiz(results: readonly boolean[]): QuizScore {
  const total = results.length;
  const correct = results.filter(Boolean).length;
  return { correct, total, percent: total === 0 ? 0 : Math.round((correct / total) * 100) };
}

/** A quiz counts as passed for the "Seerah Student" badge from 70 %. */
export const GOOD_SCORE_PERCENT = 70;
