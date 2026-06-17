import React from 'react';

interface MoneyProps extends React.HTMLAttributes<HTMLSpanElement> {
  data?: {
    amount: string;
    currencyCode?: string;
  } | null;
  withoutTrailingZeros?: boolean;
}

export function Money({data, withoutTrailingZeros, ...props}: MoneyProps) {
  if (!data) return null;
  const amount = parseFloat(data.amount);
  if (isNaN(amount)) return null;

  const parts = amount.toFixed(2).split('.');
  let numberPart = parts[0];
  const decimalPart = parts[1];

  // Add commas as thousands separators (hydration-safe)
  numberPart = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const formatted = withoutTrailingZeros || decimalPart === '00'
    ? numberPart
    : `${numberPart}.${decimalPart}`;

  return <span {...props}>Rs. {formatted}</span>;
}
