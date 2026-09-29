// Money is held as rupees but every sum goes through integer paise so 0.1 + 0.2 style drift never reaches the UI.
export function toPaise(rupees: number): number {
  return Math.round((rupees + Number.EPSILON * Math.sign(rupees)) * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

export function roundMoney(rupees: number): number {
  return fromPaise(toPaise(rupees));
}

export function sumMoney(values: readonly number[]): number {
  return fromPaise(values.reduce((acc, v) => acc + toPaise(v), 0));
}
