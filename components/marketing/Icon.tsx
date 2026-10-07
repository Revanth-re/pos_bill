import { Zap, Ticket, Printer, HandCoins, UtensilsCrossed, ReceiptText, Users, Wallet, BarChart3, FileText, WifiOff, Smartphone, type LucideProps } from "lucide-react";

const MAP = { Zap, Ticket, Printer, HandCoins, UtensilsCrossed, ReceiptText, Users, Wallet, BarChart3, FileText, WifiOff, Smartphone };

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const C = MAP[name as keyof typeof MAP] ?? Zap;
  return <C {...props} />;
}
