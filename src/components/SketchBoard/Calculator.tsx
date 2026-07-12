"use client";

import React, { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Delete, Calculator as CalculatorIcon } from "lucide-react";
import { evaluateExpression, formatResult } from "./mathParser";

type HistoryEntry = { expr: string; result: string };

const FN_ROWS: string[][] = [
  ["sin(", "cos(", "tan(", "ln(", "log("],
  ["asin(", "acos(", "atan(", "√(", "^"],
];

const NUM_ROWS: string[][] = [
  ["7", "8", "9", "(", ")"],
  ["4", "5", "6", "×", "÷"],
  ["1", "2", "3", "+", "−"],
  ["0", ".", "π", "e", "!"],
];

export default function Calculator() {
  const { t } = useTranslation();
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [angle, setAngle] = useState<"deg" | "rad">("deg");
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const evaluate = () => {
    if (!expr.trim()) return;
    try {
      const raw = evaluateExpression(expr, angle);
      if (!isFinite(raw)) throw new Error("Math error");
      const value = formatResult(raw);
      setResult(value);
      setIsError(false);
      setHistory((h) => [{ expr, result: value }, ...h].slice(0, 6));
    } catch {
      setResult(t("sketchBoard.calc.error"));
      setIsError(true);
    }
  };

  const append = (token: string) => {
    setExpr((e) => e + token);
    setResult(null);
    setIsError(false);
  };

  const backspace = () => {
    setExpr((e) => e.slice(0, -1));
    setResult(null);
    setIsError(false);
  };

  const clearAll = () => {
    setExpr("");
    setResult(null);
    setIsError(false);
  };

  const keyBtn =
    "py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer";

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <CalculatorIcon className="w-4 h-4 text-blue-500" />
          {t("sketchBoard.calc.title")}
        </h3>
        <button
          type="button"
          onClick={() => setAngle((a) => (a === "deg" ? "rad" : "deg"))}
          className="px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          {angle === "deg"
            ? t("sketchBoard.calc.degrees")
            : t("sketchBoard.calc.radians")}
        </button>
      </div>

      {/* Display */}
      <input
        type="text"
        dir="ltr"
        value={expr}
        onChange={(e) => {
          setExpr(e.target.value);
          setResult(null);
          setIsError(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            evaluate();
          }
        }}
        placeholder={t("sketchBoard.calc.placeholder")}
        className="w-full px-3 py-2 text-base font-mono text-start rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label={t("sketchBoard.calc.title")}
      />
      <div
        dir="ltr"
        className={`mt-1.5 h-8 px-3 flex items-center justify-end text-lg font-mono font-semibold ${
          isError
            ? "text-red-500 dark:text-red-400"
            : "text-gray-900 dark:text-white"
        }`}
        aria-live="polite"
      >
        {result !== null && `= ${result}`}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-4 gap-1.5 mt-1">
        <button
          type="button"
          onClick={clearAll}
          className={`${keyBtn} text-red-600 dark:text-red-400`}
        >
          C
        </button>
        <button
          type="button"
          onClick={backspace}
          className={`${keyBtn} flex items-center justify-center`}
          title={t("sketchBoard.calc.backspace")}
          aria-label={t("sketchBoard.calc.backspace")}
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={evaluate}
          className="col-span-2 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          title={t("sketchBoard.calc.equals")}
        >
          =
        </button>
      </div>

      {/* Function + number pad */}
      <div className="mt-1.5 space-y-1.5">
        {[...FN_ROWS, ...NUM_ROWS].map((row, ri) => (
          <div key={ri} className="grid grid-cols-5 gap-1.5" dir="ltr">
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => append(key)}
                className={`${keyBtn} ${
                  ri < FN_ROWS.length
                    ? "text-blue-600 dark:text-blue-400 text-xs"
                    : ""
                }`}
              >
                {key.length > 1 && key.endsWith("(") ? key.slice(0, -1) : key}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-2">
          <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">
            {t("sketchBoard.calc.history")}
          </div>
          <ul className="space-y-0.5 max-h-28 overflow-y-auto">
            {history.map((h, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  dir="ltr"
                  onClick={() => {
                    setExpr(h.result);
                    setResult(null);
                    setIsError(false);
                  }}
                  className="w-full text-start px-2 py-1 rounded text-xs font-mono text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer truncate"
                  title={`${h.expr} = ${h.result}`}
                >
                  {h.expr} = <span className="font-semibold">{h.result}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
