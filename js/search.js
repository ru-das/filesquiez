// encode(quality 0..1, scale 0..1) -> Promise<Blob>
// Finds the highest quality at or under targetBytes, shrinking dimensions if needed.
export async function search(encode, targetBytes, onProgress = () => {}, minScale = 0.05) {
  let smallest = null;
  const steps = Math.ceil(Math.log(minScale) / Math.log(0.8));
  for (let i = 0; i <= steps; i++) {
    const scale = Math.max(Math.pow(0.8, i), minScale);
    onProgress(i / (steps + 1), scale < 1 ? `Resizing to ${Math.round(scale * 100)}%...` : 'Compressing...');
    const low = await encode(0, scale);
    if (!smallest || low.size < smallest.size) smallest = low;
    if (low.size > targetBytes) continue;
    let best = low, lo = 0, hi = 1;
    for (let k = 0; k < 8; k++) {
      const mid = (lo + hi) / 2;
      const b = await encode(mid, scale);
      if (b.size <= targetBytes) { best = b; lo = mid; } else hi = mid;
    }
    return { blob: best, targetMet: true };
  }
  return { blob: smallest, targetMet: false };
}
