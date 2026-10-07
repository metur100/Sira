import type { LocalizedText } from './common';

/**
 * What the question trains – used for labels and filtering:
 * general · timeline ordering · sequence ("which came first") · connection ·
 * person→event, place→event and event→lesson matching.
 */
export type QuestionKind = 'general' | 'timeline' | 'sequence' | 'connection' | 'personEvent' | 'placeEvent' | 'eventLesson';

interface QuestionBase {
  id: string;
  episodeId: string;
  kind: QuestionKind;
  prompt: LocalizedText;
  explanation: LocalizedText;
  sourceIds: string[];
}

export interface QuestionOption {
  id: string;
  text: LocalizedText;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multipleChoice';
  options: QuestionOption[];
  correctOptionId: string;
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'trueFalse';
  correct: boolean;
}

/** Items are listed in the correct order; the UI shuffles them. */
export interface OrderingQuestion extends QuestionBase {
  type: 'ordering';
  items: QuestionOption[];
}

export interface MatchingPair {
  id: string;
  left: LocalizedText;
  right: LocalizedText;
}

export interface MatchingQuestion extends QuestionBase {
  type: 'matching';
  pairs: MatchingPair[];
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | OrderingQuestion | MatchingQuestion;

export type AnswerInput =
  | { type: 'option'; optionId: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'order'; ids: string[] }
  | { type: 'pairs'; mistakes: number };
