export type AngleMode = "deg" | "rad";

// Safe recursive-descent expression evaluator — no eval().
// Supports + - * / ^ ! ( ), sin cos tan asin acos atan ln log sqrt abs
// sign step, constants pi/e, scientific notation, implicit multiplication
// (2pi, 3(1+2), 2x), and optional variables (e.g. { x: 1.5 }) for plotting.
export function evaluateExpression(
  input: string,
  angle: AngleMode,
  vars?: Record<string, number>
): number {
  const expr = input
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt");
  let i = 0;

  const isDigit = (c: string) => c >= "0" && c <= "9";
  const isLetter = (c: string) => /[a-z]/i.test(c);
  const skipWs = () => {
    while (expr[i] === " ") i++;
  };

  const toRad = (x: number) => (angle === "deg" ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (angle === "deg" ? (x * 180) / Math.PI : x);

  const factorial = (v: number): number => {
    if (v < 0 || !Number.isInteger(v) || v > 170) {
      throw new Error("Invalid factorial");
    }
    let r = 1;
    for (let n = 2; n <= v; n++) r *= n;
    return r;
  };

  const applyFn = (name: string, arg: number): number => {
    switch (name) {
      case "sin":
        return Math.sin(toRad(arg));
      case "cos":
        return Math.cos(toRad(arg));
      case "tan":
        return Math.tan(toRad(arg));
      case "asin":
        return fromRad(Math.asin(arg));
      case "acos":
        return fromRad(Math.acos(arg));
      case "atan":
        return fromRad(Math.atan(arg));
      case "ln":
        return Math.log(arg);
      case "log":
        return Math.log10(arg);
      case "sqrt":
        return Math.sqrt(arg);
      case "abs":
        return Math.abs(arg);
      case "sign":
        return Math.sign(arg);
      case "step":
        // Heaviside step — lets users build piecewise shapes like a
        // square potential well: -4*(step(x+2)-step(x-2))
        return arg < 0 ? 0 : 1;
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  };

  function parseExpr(): number {
    let v = parseTerm();
    skipWs();
    while (expr[i] === "+" || expr[i] === "-") {
      const op = expr[i++];
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
      skipWs();
    }
    return v;
  }

  function parseTerm(): number {
    let v = parseFactor();
    skipWs();
    for (;;) {
      const c = expr[i];
      if (c === "*" || c === "/") {
        i++;
        const r = parseFactor();
        v = c === "*" ? v * r : v / r;
      } else if (c && (isDigit(c) || c === "." || c === "(" || isLetter(c))) {
        v = v * parseFactor(); // implicit multiplication
      } else {
        break;
      }
      skipWs();
    }
    return v;
  }

  function parseFactor(): number {
    skipWs();
    if (expr[i] === "-") {
      i++;
      return -parseFactor();
    }
    if (expr[i] === "+") {
      i++;
      return parseFactor();
    }
    let v = parsePostfix();
    skipWs();
    if (expr[i] === "^") {
      i++;
      v = Math.pow(v, parseFactor()); // right-associative
    }
    return v;
  }

  function parsePostfix(): number {
    let v = parsePrimary();
    skipWs();
    while (expr[i] === "!") {
      i++;
      v = factorial(v);
      skipWs();
    }
    return v;
  }

  function parsePrimary(): number {
    skipWs();
    const c = expr[i];
    if (c === "(") {
      i++;
      const v = parseExpr();
      skipWs();
      if (expr[i] !== ")") throw new Error("Missing )");
      i++;
      return v;
    }
    if (c !== undefined && (isDigit(c) || c === ".")) {
      const m = /^\d*\.?\d+(e[+-]?\d+)?/i.exec(expr.slice(i));
      if (!m) throw new Error("Invalid number");
      i += m[0].length;
      return parseFloat(m[0]);
    }
    if (c !== undefined && isLetter(c)) {
      const m = /^[a-z]+/i.exec(expr.slice(i));
      if (!m) throw new Error("Invalid token");
      const name = m[0].toLowerCase();
      i += m[0].length;
      if (vars && name in vars) return vars[name];
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      skipWs();
      if (expr[i] !== "(") throw new Error("Expected (");
      i++;
      const arg = parseExpr();
      skipWs();
      if (expr[i] !== ")") throw new Error("Missing )");
      i++;
      return applyFn(name, arg);
    }
    throw new Error("Unexpected end of expression");
  }

  const result = parseExpr();
  skipWs();
  if (i < expr.length) throw new Error("Unexpected input");
  if (isNaN(result)) throw new Error("Math error");
  return result;
}

export function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  return String(parseFloat(n.toPrecision(12)));
}
