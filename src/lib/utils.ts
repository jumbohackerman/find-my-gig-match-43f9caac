import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isCurrentYear = date.getFullYear() === now.getFullYear();
  
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    ...(isCurrentYear ? {} : { year: 'numeric' })
  }).format(date);
}

export function formatMoney(amount: number, currency = 'PLN'): string {
  const formatted = new Intl.NumberFormat('pl-PL', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
  
  const symbol = currency === 'PLN' ? 'zł' : currency;
  return `${formatted} ${symbol}`;
}

export function formatSalaryRange(min?: number, max?: number, currency = 'PLN'): string {
  if (!min && !max) return "Wynagrodzenie nie podane";
  
  const symbol = currency === 'PLN' ? 'zł' : currency;
  
  const formatNum = (val: number) => new Intl.NumberFormat('pl-PL', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(val);

  if (min && max) {
    if (min === max) return `${formatNum(min)} ${symbol}`;
    return `${formatNum(min)} - ${formatNum(max)} ${symbol}`;
  }
  if (min) return `od ${formatNum(min)} ${symbol}`;
  return `do ${formatNum(max!)} ${symbol}`;
}
