import { Fragment, type ReactNode } from "react";

export function renderBold(text: string): ReactNode[] {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <strong key={index}>{part.slice(1, -1)}</strong>;
    }
    if (part.length === 0) return <Fragment key={index} />;
    return <span key={index}>{part}</span>;
  });
}

export function MessageText({ text }: { text: string }) {
  return (
    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
      {renderBold(text)}
    </div>
  );
}