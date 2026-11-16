import { MessageCircle } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="Koneksi">
      <span className="brand-symbol">
        <MessageCircle size={20} strokeWidth={2.2} />
        <span className="brand-spark" />
      </span>
      {!compact && (
        <span className="brand-name">
          koneksi<span>.</span>
        </span>
      )}
    </div>
  );
}
