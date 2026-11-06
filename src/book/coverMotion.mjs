export function coverSwing(progress) {
  return Math.min(1, Math.max(0, (progress - 0.24) / 0.76))
}
