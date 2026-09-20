import zxcvbn from "zxcvbn";

export interface StrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very Weak" | "Weak" | "Fair" | "Strong" | "Very Strong";
  feedback: string[];
  crackTimeDisplay: string;
}

const LABELS: StrengthResult["label"][] = [
  "Very Weak",
  "Weak",
  "Fair",
  "Strong",
  "Very Strong",
];

export function analyzePasswordStrength(password: string): StrengthResult {
  const result = zxcvbn(password);

  return {
    score: result.score as StrengthResult["score"],
    label: LABELS[result.score],
    feedback: [
      ...(result.feedback.warning ? [result.feedback.warning] : []),
      ...result.feedback.suggestions,
    ],
    crackTimeDisplay: String(
      result.crack_times_display.offline_slow_hashing_1e4_per_second
    ),
  };
}
