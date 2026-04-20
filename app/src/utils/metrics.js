export function calcTrend(cur, prev) {
  const safeCur = Number(cur) || 0;
  const safePrev = Number(prev) || 0;
  const diff = safeCur - safePrev;
  const pct = safePrev > 0 ? Math.abs(Math.round((diff / safePrev) * 100)) : 0;

  return {
    diff,
    pct,
    direction: diff >= 0 ? "up" : "down",
  };
}
