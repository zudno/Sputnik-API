import { useRef } from "react";

interface HighlightedInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  availableVariables: Set<string>;
  className?: string;
}

export function HighlightedInput({ value, onChange, placeholder, availableVariables, className = "" }: HighlightedInputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLInputElement>) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const renderHighlighted = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2).trim();
        const isAvailable = availableVariables.has(key);
        
        if (isAvailable) {
          return <span key={i} className="text-[#5bb3ff] bg-[#1e2a35] rounded-md px-1 py-[1px]">{part}</span>;
        } else {
          return <span key={i} className="text-[#ff5c5c] bg-[#4a1c1c] rounded-md px-1 py-[1px]">{part}</span>;
        }
      }
      return <span key={i} className="text-vsc-foreground">{part}</span>;
    });
  };

  return (
    <div className={`relative flex-grow h-full overflow-hidden ${className}`}>
      {/* Background layer for highlighted text */}
      <div 
        ref={scrollRef}
        className="absolute inset-0 px-3 py-2.5 font-sans whitespace-pre overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {!value && placeholder ? (
           <span className="text-neutral-500">{placeholder}</span>
        ) : (
           renderHighlighted(value)
        )}
      </div>
      {/* Actual input overlay */}
      <input 
        type="text" 
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={handleScroll}
        className="bg-transparent font-sans px-3 py-2.5 outline-none border-none w-full relative z-10" 
        spellCheck={false}
        style={{ 
          color: 'transparent', 
          caretColor: '#cccccc' 
        }}
      />
    </div>
  );
}
