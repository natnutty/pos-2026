// Formatting helpers for Indonesian Rupiah, dates, and numbers
import { Language } from '../i18n/translations';

export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number, lang: Language = 'id'): string => {
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  return new Intl.NumberFormat(locale).format(num);
};

export const formatDateLocalized = (dateStr: string, lang: Language = 'id'): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatDateIndonesian = (dateStr: string, lang: Language = 'id'): string => {
  return formatDateLocalized(dateStr, lang);
};

export const formatDateTimeLocalized = (timestamp: number | string, lang: Language = 'id'): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const formatDateTimeIndonesian = (timestamp: number | string, lang: Language = 'id'): string => {
  return formatDateTimeLocalized(timestamp, lang);
};

export const formatTimeOnly = (timestamp: number | string, lang: Language = 'id'): string => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

export const getCategoryLabel = (category: string, lang: Language = 'id'): string => {
  if (lang === 'en') {
    switch (category) {
      case 'nasi':
        return 'Cat Rice / Meals';
      case 'sate':
        return 'Skewers & Satay';
      case 'gorengan':
        return 'Fried Snacks';
      case 'minuman':
        return 'Drinks & Herbal Tea';
      case 'camilan':
        return 'Snacks & Bites';
      default:
        return 'Others';
    }
  }

  switch (category) {
    case 'nasi':
      return 'Nasi Kucing';
    case 'sate':
      return 'Aneka Sate';
    case 'gorengan':
      return 'Gorengan';
    case 'minuman':
      return 'Minuman / Wedang';
    case 'camilan':
      return 'Camilan';
    default:
      return 'Lainnya';
  }
};

export const getCategoryBadgeColor = (category: string): { bg: string; text: string; border: string } => {
  switch (category) {
    case 'nasi':
      return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' };
    case 'sate':
      return { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300' };
    case 'gorengan':
      return { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300' };
    case 'minuman':
      return { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' };
    case 'camilan':
      return { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-300' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' };
  }
};
