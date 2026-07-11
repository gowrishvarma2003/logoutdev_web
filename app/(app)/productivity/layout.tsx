import ProductivityShell from "@/components/productivity/ProductivityShell";

export default function ProductivityLayout({ children }: { children: React.ReactNode }) {
  return <ProductivityShell>{children}</ProductivityShell>;
}
