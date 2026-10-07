import { useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';

import { sourceShortLabel } from '@/components/content/Blocks';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getSource, resolve } from '@/content';
import { useFeedback } from '@/hooks/useFeedback';
import { useI18n } from '@/hooks/useI18n';
import { useTheme } from '@/hooks/useTheme';
import type { MatchingQuestion, MultipleChoiceQuestion, OrderingQuestion, Question } from '@/models';
import { evaluateAnswer } from '@/services/quiz';
import type { Palette } from '@/theme';
import { radius, spacing } from '@/theme';
import { hashString, seededRandom, shuffle, shuffleNotIdentity } from '@/utils/random';

interface Result {
  correct: boolean;
  correctAnswer: string;
}

interface PartProps<Q extends Question> {
  question: Q;
  locked: boolean;
  onAnswered: (r: Result) => void;
}

function tileStyle(c: Palette, state: 'idle' | 'selected' | 'correct' | 'wrong' | 'dim') {
  switch (state) {
    case 'selected':
      return { borderColor: c.primary, backgroundColor: c.goldSoft };
    case 'correct':
      return { borderColor: c.success, backgroundColor: c.successSoft };
    case 'wrong':
      return { borderColor: c.error, backgroundColor: c.errorSoft };
    case 'dim':
      return { borderColor: c.border, backgroundColor: c.surface, opacity: 0.55 };
    default:
      return { borderColor: c.border, backgroundColor: c.surface };
  }
}

function Choice({ question, locked, onAnswered }: PartProps<MultipleChoiceQuestion>) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const options = useMemo(() => shuffle(question.options, seededRandom(hashString(question.id))), [question]);
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <View style={styles.list}>
      {options.map((o, i) => {
        const state = !picked ? 'idle' : o.id === question.correctOptionId ? 'correct' : o.id === picked ? 'wrong' : 'dim';
        return (
          <Pressable
            key={o.id}
            disabled={!!picked || locked}
            onPress={() => {
              setPicked(o.id);
              onAnswered({ correct: evaluateAnswer(question, { type: 'option', optionId: o.id }), correctAnswer: l(question.options.find((x) => x.id === question.correctOptionId)?.text) });
            }}
            accessibilityRole="button"
            accessibilityLabel={`${String.fromCharCode(65 + i)}: ${l(o.text)}${state === 'correct' ? `, ${t('a11y.correct')}` : state === 'wrong' ? `, ${t('a11y.incorrect')}` : ''}`}
            style={[styles.option, tileStyle(c, state)]}
          >
            <View style={[styles.letter, { borderColor: c.border }]}>
              <AppText variant="small" color={c.accent}>
                {String.fromCharCode(65 + i)}
              </AppText>
            </View>
            <AppText variant="bodyBold" style={styles.flex}>
              {l(o.text)}
            </AppText>
            {state === 'correct' ? <Icon name="check" size={20} color={c.success} strokeWidth={2.6} /> : null}
            {state === 'wrong' ? <Icon name="close" size={20} color={c.error} strokeWidth={2.6} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function TrueFalse({ question, locked, onAnswered }: PartProps<Extract<Question, { type: 'trueFalse' }>>) {
  const { c } = useTheme();
  const { t } = useI18n();
  const [picked, setPicked] = useState<boolean | null>(null);
  return (
    <View style={styles.row}>
      {[true, false].map((value) => {
        const state = picked === null ? 'idle' : value === question.correct ? 'correct' : value === picked ? 'wrong' : 'dim';
        const label = value ? t('quiz.true') : t('quiz.false');
        return (
          <Pressable
            key={String(value)}
            disabled={picked !== null || locked}
            onPress={() => {
              setPicked(value);
              onAnswered({ correct: evaluateAnswer(question, { type: 'boolean', value }), correctAnswer: question.correct ? t('quiz.true') : t('quiz.false') });
            }}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={[styles.option, styles.flex, styles.center, tileStyle(c, state)]}
          >
            <AppText variant="bodyBold">{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Ordering({ question, locked, onAnswered }: PartProps<OrderingQuestion>) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const items = useMemo(() => shuffleNotIdentity(question.items, seededRandom(hashString(question.id))), [question]);
  const [order, setOrder] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const remaining = items.filter((i) => !order.includes(i.id));
  const correctIds = question.items.map((i) => i.id);

  return (
    <View style={styles.list}>
      <AppText variant="small" muted>
        {t('quiz.ordering.hint')}
      </AppText>
      <View style={[styles.slots, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
        {order.map((id, index) => {
          const item = question.items.find((i) => i.id === id)!;
          const state = !submitted ? 'selected' : correctIds[index] === id ? 'correct' : 'wrong';
          return (
            <Pressable
              key={id}
              disabled={submitted || locked}
              onPress={() => setOrder(order.filter((x) => x !== id))}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}. ${l(item.text)}`}
              style={[styles.option, tileStyle(c, state)]}
            >
              <AppText variant="bodyBold" color={c.accent}>
                {index + 1}
              </AppText>
              <AppText variant="body" style={styles.flex}>
                {l(item.text)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {remaining.map((item) => (
        <Pressable
          key={item.id}
          disabled={submitted || locked}
          onPress={() => setOrder([...order, item.id])}
          accessibilityRole="button"
          accessibilityLabel={l(item.text)}
          style={[styles.option, tileStyle(c, 'idle')]}
        >
          <Icon name="plus" size={18} color={c.textMuted} />
          <AppText variant="body" style={styles.flex}>
            {l(item.text)}
          </AppText>
        </Pressable>
      ))}
      {!submitted ? (
        <View style={styles.row}>
          <Button label={t('quiz.ordering.reset')} variant="secondary" compact onPress={() => setOrder([])} disabled={order.length === 0} style={styles.flex} />
          <Button
            label={t('quiz.check')}
            compact
            disabled={remaining.length > 0}
            style={styles.flex}
            onPress={() => {
              setSubmitted(true);
              onAnswered({ correct: evaluateAnswer(question, { type: 'order', ids: order }), correctAnswer: question.items.map((i) => l(i.text)).join(' → ') });
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

function Matching({ question, locked, onAnswered }: PartProps<MatchingQuestion>) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const feedback = useFeedback();
  const random = useMemo(() => seededRandom(hashString(question.id)), [question.id]);
  const left = useMemo(() => shuffle(question.pairs, random), [question.pairs, random]);
  const right = useMemo(() => shuffle(question.pairs, random), [question.pairs, random]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const tapRight = (id: string) => {
    if (!selected || locked) return;
    if (selected === id) {
      feedback.success();
      const next = [...matched, id];
      setMatched(next);
      setSelected(null);
      setWrong(null);
      if (next.length === question.pairs.length) {
        onAnswered({
          correct: evaluateAnswer(question, { type: 'pairs', mistakes }),
          correctAnswer: question.pairs.map((p) => `${l(p.left)} – ${l(p.right)}`).join('; '),
        });
      }
    } else {
      feedback.failure();
      setMistakes((m) => m + 1);
      setWrong(id);
    }
  };

  return (
    <View style={styles.list}>
      <View style={styles.row}>
        <AppText variant="small" muted style={styles.flex}>
          {t('quiz.matching.hint')}
        </AppText>
        <AppText variant="small" color={mistakes ? c.error : c.textMuted}>
          {t('quiz.matching.mistakes', { count: mistakes })}
        </AppText>
      </View>
      <View style={styles.row}>
        <View style={[styles.flex, styles.list]}>
          {left.map((p) => {
            const done = matched.includes(p.id);
            const state = done ? 'correct' : selected === p.id ? 'selected' : 'idle';
            return (
              <Pressable
                key={p.id}
                disabled={done || locked}
                onPress={() => {
                  setSelected(p.id);
                  setWrong(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: selected === p.id, disabled: done }}
                accessibilityLabel={`${l(p.left)}${done ? `, ${t('a11y.correct')}` : selected === p.id ? `, ${t('a11y.selected')}` : ''}`}
                style={[styles.tile, tileStyle(c, state)]}
              >
                <AppText variant="small" align="center">
                  {l(p.left)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.flex, styles.list]}>
          {right.map((p) => {
            const done = matched.includes(p.id);
            const state = done ? 'correct' : wrong === p.id ? 'wrong' : 'idle';
            return (
              <Pressable
                key={p.id}
                disabled={done || locked || !selected}
                onPress={() => tapRight(p.id)}
                accessibilityRole="button"
                accessibilityLabel={`${l(p.right)}${done ? `, ${t('a11y.correct')}` : wrong === p.id ? `, ${t('a11y.incorrect')}` : ''}`}
                style={[styles.tile, tileStyle(c, state), state === 'idle' && { backgroundColor: c.surfaceAlt }]}
              >
                <AppText variant="small" align="center">
                  {l(p.right)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface QuizCardProps {
  question: Question;
  onResult: (correct: boolean) => void;
  onContinue: () => void;
  counter?: string;
  /** Hide the "saved to review" hint (e.g. in the review session itself). */
  showReviewNote?: boolean;
}

/** QuizCard: renders a question of any type, then "Correct" or "Not quite" with the explanation and sources. */
export function QuizCard({ question, onResult, onContinue, counter, showReviewNote = true }: QuizCardProps) {
  const { c } = useTheme();
  const { t, l } = useI18n();
  const feedback = useFeedback();
  const [result, setResult] = useState<Result | null>(null);
  const sources = resolve(question.sourceIds, getSource);

  const answered = (r: Result) => {
    if (result) return;
    setResult(r);
    if (r.correct) feedback.success();
    else feedback.failure();
    onResult(r.correct);
    AccessibilityInfo.announceForAccessibility(r.correct ? t('quiz.correct') : `${t('quiz.notQuite')}. ${t('quiz.correctAnswer', { answer: r.correctAnswer })}`);
  };

  const showAnswerLine = result && !result.correct && (question.type === 'ordering' || question.type === 'matching' || question.type === 'trueFalse' || question.type === 'multipleChoice');

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={[styles.kind, { backgroundColor: c.goldSoft }]}>
          <AppText variant="label" color={c.accent}>
            {t(`quiz.kind.${question.kind}`)}
          </AppText>
        </View>
        <View style={styles.flex} />
        {counter ? (
          <AppText variant="tiny" muted>
            {counter}
          </AppText>
        ) : null}
      </View>
      <AppText variant="heading" accessibilityRole="header">
        {l(question.prompt)}
      </AppText>

      {question.type === 'multipleChoice' ? <Choice question={question} locked={!!result} onAnswered={answered} /> : null}
      {question.type === 'trueFalse' ? <TrueFalse question={question} locked={!!result} onAnswered={answered} /> : null}
      {question.type === 'ordering' ? <Ordering question={question} locked={!!result} onAnswered={answered} /> : null}
      {question.type === 'matching' ? <Matching question={question} locked={!!result} onAnswered={answered} /> : null}

      {result ? (
        <View
          style={[styles.feedback, { backgroundColor: result.correct ? c.successSoft : c.interpretationSoft, borderColor: result.correct ? c.success : c.interpretation }]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.row}>
            <Icon name={result.correct ? 'check' : 'sparkle'} size={22} color={result.correct ? c.success : c.interpretation} strokeWidth={2.4} />
            <AppText variant="heading" color={result.correct ? c.success : c.interpretation}>
              {result.correct ? t('quiz.correct') : t('quiz.notQuite')}
            </AppText>
          </View>
          {showAnswerLine ? <AppText variant="bodyBold">{t('quiz.correctAnswer', { answer: result.correctAnswer })}</AppText> : null}
          <AppText variant="body">{l(question.explanation)}</AppText>
          {sources.length ? (
            <AppText variant="tiny" muted>
              {sources.map(sourceShortLabel).join(' · ')}
            </AppText>
          ) : null}
          {!result.correct && showReviewNote ? (
            <AppText variant="small" muted>
              {t('quiz.addedToReview')}
            </AppText>
          ) : null}
          <Button label={t('common.continue')} iconRight="chevron" onPress={onContinue} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { gap: spacing.sm },
  kind: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  letter: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  slots: { minHeight: 64, borderWidth: 1, borderStyle: 'dashed', borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
  tile: { minHeight: 64, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  feedback: { borderWidth: 1.5, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
});
