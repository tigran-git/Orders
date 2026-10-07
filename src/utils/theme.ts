export interface ProductTheme {
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  textColor: string;
  priceColor: string;
  bgLight: string;
  borderColor: string;
  borderLeft: string;
  label: string;
}

export function getProductTheme(colorOrCategory?: string): ProductTheme {
  switch (colorOrCategory) {
    case 'cvet1':
      return {
        dotColor: 'bg-amber-500',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-900',
        badgeBorder: 'border-amber-300',
        textColor: 'text-amber-950',
        priceColor: 'text-amber-700',
        bgLight: 'bg-amber-50/70',
        borderColor: 'border-amber-400',
        borderLeft: 'border-l-amber-500',
        label: 'ՋԵՐԿԻ',
      };
    case 'cvet2':
      return {
        dotColor: 'bg-blue-500',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-900',
        badgeBorder: 'border-blue-300',
        textColor: 'text-blue-950',
        priceColor: 'text-blue-700',
        bgLight: 'bg-blue-50/70',
        borderColor: 'border-blue-400',
        borderLeft: 'border-l-blue-500',
        label: 'ԱԿԱՆՋ',
      };
    case 'cvet3':
      return {
        dotColor: 'bg-emerald-500',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-900',
        badgeBorder: 'border-emerald-300',
        textColor: 'text-emerald-950',
        priceColor: 'text-emerald-700',
        bgLight: 'bg-emerald-50/70',
        borderColor: 'border-emerald-400',
        borderLeft: 'border-l-emerald-500',
        label: 'ՊԱՆԻՐ',
      };
    case 'cvet4':
      return {
        dotColor: 'bg-purple-500',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-900',
        badgeBorder: 'border-purple-300',
        textColor: 'text-purple-950',
        priceColor: 'text-purple-700',
        bgLight: 'bg-purple-50/70',
        borderColor: 'border-purple-400',
        borderLeft: 'border-l-purple-500',
        label: 'ՍՆԵՔ',
      };
    case 'cvet5':
      return {
        dotColor: 'bg-rose-500',
        badgeBg: 'bg-rose-100',
        badgeText: 'text-rose-900',
        badgeBorder: 'border-rose-300',
        textColor: 'text-rose-950',
        priceColor: 'text-rose-700',
        bgLight: 'bg-rose-50/70',
        borderColor: 'border-rose-400',
        borderLeft: 'border-l-rose-500',
        label: 'ՍԻՍԵՌ',
      };
    default:
      return {
        dotColor: 'bg-slate-400',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-800',
        badgeBorder: 'border-slate-300',
        textColor: 'text-slate-900',
        priceColor: 'text-slate-700',
        bgLight: 'bg-slate-50',
        borderColor: 'border-slate-300',
        borderLeft: 'border-l-slate-400',
        label: 'ԱՊՐԱՆՔ',
      };
  }
}
