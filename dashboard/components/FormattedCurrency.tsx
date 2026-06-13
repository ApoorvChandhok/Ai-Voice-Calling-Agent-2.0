"use client";

import { useAppContext } from "./app-provider";

export default function FormattedCurrency({ value, className }: { value: number | string, className?: string }) {
  const { formatCurrency } = useAppContext();
  
  // Clean up if it's a string like "$12.34"
  const numericValue = typeof value === "string" 
    ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
    : value;

  return <span className={className}>{formatCurrency(numericValue || 0)}</span>;
}

export function CurrencySymbol() {
  const { currency } = useAppContext();
  const symbols: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return <>{symbols[currency] || "₹"}</>;
}
