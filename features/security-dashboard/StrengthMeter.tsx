"use client";

import { useMemo } from "react";
import { analyzePasswordStrength } from "./passwordStrength";

const LABEL_COLORS: Record<string, string> = {
  "Very Weak": "text-red-700",
  "Weak": "text-red-500",
  "Fair": "text-yellow-600",
  "Strong": "text-green-600",
  "Very Strong": "text-green-700",
};

export function StrengthMeter({ password }: { password: string }) {
  const result = useMemo(() => {
    if (!password) return null;
    return analyzePasswordStrength(password);
  }, [password]);

  if (!result) return null;

  return (
    <div className="text-xs mt-1">
      <span className={LABEL_COLORS[result.label] ?? ""}>{result.label}</span>
      <span className="text-gray-500"> - crack time (offline): {result.crackTimeDisplay}</span>
      {result.feedback.length > 0 && (
        <ul className="list-disc list-inside text-gray-500 mt-1">
          {result.feedback.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}