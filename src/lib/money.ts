export const toCents = (n:number) => Math.round(n * 100);
export const fmt = (cents:number, currency='EUR') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents/100);
