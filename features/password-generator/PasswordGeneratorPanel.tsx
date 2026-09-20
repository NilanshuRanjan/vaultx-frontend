"use client";

import { useState, useEffect, useMemo } from "react";
import { generatePassword, DEFAULT_PASSWORD_OPTIONS } from "./generatePassword";
import type { PasswordOptions } from "./generatePassword";
import { calculateEntropyBits, entropyToLabel } from "./entropy";

export function PasswordGeneratorPanel() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  function regenerate(currentOptions: PasswordOptions) {
    try {
      setPassword(generatePassword(currentOptions));
    } catch {
      setPassword("");
    }
  }

  useEffect(() => {
    regenerate(options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const strength = useMemo(() => {
    const bits = calculateEntropyBits(options);
    return { bits: Math.round(bits), label: entropyToLabel(bits) };
  }, [options]);

  function updateOption<K extends keyof PasswordOptions>(key: K, value: PasswordOptions[K]) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCopy() {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const noCharsetSelected =
    !options.includeUppercase &&
    !options.includeLowercase &&
    !options.includeNumbers &&
    !options.includeSymbols;

  return (
    <div className="flex flex-col gap-4 max-w-md border rounded p-4">
      <div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            readOnly
            value={noCharsetSelected ? "Select at least one character set" : password}
            className="flex-1 border rounded px-3 py-2 font-mono text-sm"
          />
          <button
            onClick={handleCopy}
            disabled={noCharsetSelected}
            className="border rounded px-3 py-2 disabled:opacity-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={() => regenerate(options)}
            disabled={noCharsetSelected}
            className="border rounded px-3 py-2 disabled:opacity-50"
          >
            Regenerate
          </button>
        </div>
        {!noCharsetSelected && (
          <p className="text-xs text-gray-500 mt-1">
            {strength.label} - approx {strength.bits} bits of entropy
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Length: {options.length}
        </label>
        <input
          type="range"
          min={8}
          max={64}
          value={options.length}
          onChange={(e) => updateOption("length", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.includeUppercase}
            onChange={(e) => updateOption("includeUppercase", e.target.checked)}
          />
          Uppercase (A-Z)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.includeLowercase}
            onChange={(e) => updateOption("includeLowercase", e.target.checked)}
          />
          Lowercase (a-z)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.includeNumbers}
            onChange={(e) => updateOption("includeNumbers", e.target.checked)}
          />
          Numbers (0-9)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.includeSymbols}
            onChange={(e) => updateOption("includeSymbols", e.target.checked)}
          />
          Symbols (!@#$...)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.excludeAmbiguous}
            onChange={(e) => updateOption("excludeAmbiguous", e.target.checked)}
          />
          Exclude ambiguous characters (0, O, 1, l, I)
        </label>
      </div>
    </div>
  );
}