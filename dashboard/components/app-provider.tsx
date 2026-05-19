"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type Currency = "USD" | "INR" | "EUR" | "GBP";

const currencyRates: Record<Currency, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
};

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

interface AppContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatCurrency: (amountInUsd: number) => string;
}

export const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = React.useState<Currency>("USD");

  React.useEffect(() => {
    const saved = localStorage.getItem("app-currency") as Currency;
    if (saved && currencyRates[saved]) {
      setCurrency(saved);
    }
  }, []);

  const handleSetCurrency = (c: Currency) => {
    setCurrency(c);
    localStorage.setItem("app-currency", c);
  };

  const formatCurrency = (amountInUsd: number) => {
    const converted = amountInUsd * currencyRates[currency];
    return `${currencySymbols[currency]}${converted.toFixed(3)}`;
  };

  return (
    <AppContext.Provider value={{ currency, setCurrency: handleSetCurrency, formatCurrency }}>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </NextThemesProvider>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
}
