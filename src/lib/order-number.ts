export function generateOrderNumber(prefix: string): string {
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${time}${rand}`;
}
