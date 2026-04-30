export const naira = (n: number) =>
  '₦' + new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(n);

export const shortNaira = (n: number) => {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return '₦' + (n / 1_000).toFixed(0) + 'K';
  return naira(n);
};
