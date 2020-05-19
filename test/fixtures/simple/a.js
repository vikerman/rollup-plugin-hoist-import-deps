export async function threeXPlusOne(x) {
  const { inc } = await import('./b.js');
  const { double } = await import('./c.js');
  const { add } = await import('./d.js');

  return add(double(x), inc(x));
}
