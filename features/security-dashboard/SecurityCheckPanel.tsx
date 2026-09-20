"use client";

import { useState } from "react";
import { analyzePasswordStrength } from "./passwordStrength";
import type { StrengthResult } from "./passwordStrength";
import { checkPasswordBreach } from "./breachCheck";
import type { BreachCheckResult } from "./breachCheck";

export function SecurityCheckPanel() {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState<StrengthResult | null>(null);
  const [breach, setBreach] = useState<BreachCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePasswordChange(value: string) {
    setPassword(value);
    setBreach(null);
    setError(null);
    setStrength(value ? analyzePasswordStrength(value) : null);
  }

  async function handleBreachCheck() {
    if (!password) return;
    setIsChecking(true);
    setError(null);
    try {
      const result = await checkPasswordBreach(password);
      setBreach(result);
    } catch {
      setError("Could not check breach status - try again");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-md border rounded p-4">
      <h2 className="text-lg font-bold">Security Check</h2>
      <p className="text-xs text-gray-500">
        Check any password's strength and whether it has appeared in known breaches.
        Nothing typed here is saved or sent anywhere except the breach check below,
        which sends only a partial hash prefix.
      </p>

      <div>
        <label className="block text-sm font-medium mb-1">Password to check</label>
        <input
          type="text"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          className="w-full border rounded px-3 py-2 font-mono text-sm"
        />
      </div>

      {strength && (
        <div className="text-sm">
          <p>
            Strength: <span className="font-semibold">{strength.label}</span>
          </p>
          <p className="text-xs text-gray-500">
            Estimated offline crack time: {strength.crackTimeDisplay}
          </p>
          {strength.feedback.length > 0 && (
            <ul className="list-disc list-inside text-xs text-gray-500 mt-1">
              {strength.feedback.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <button
        onClick={handleBreachCheck}
        disabled={!password || isChecking}
        className="border rounded px-4 py-2 disabled:opacity-50 self-start"
      >
        {isChecking ? "Checking..." : "Check for known breaches"}
      </button>

      {breach && (
        <p className={"text-sm " + (breach.breached ? "text-red-600" : "text-green-600")}>
          {breach.breached
            ? "This password has appeared in " + breach.occurrences.toLocaleString() + " known breach(es). Do not use it."
            : "Not found in known breaches."}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}