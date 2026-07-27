import { ChevronDown, Save } from "lucide-react";
import { useRef } from "react";

interface RequestPanelProps {
  method: string;
  setMethod: (method: string) => void;
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  onSend: () => void;
  onSave?: () => void;
}

function HighlightedInput({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) {
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
        return <span key={i} className="text-[#5bb3ff] bg-[#1e2a35] rounded-md px-1 py-[1px]">{part}</span>;
      }
      return <span key={i} className="text-vsc-foreground">{part}</span>;
    });
  };

  return (
    <div className="relative flex-grow h-full overflow-hidden">
      {/* Background layer for highlighted text */}
      <div 
        ref={scrollRef}
        className="absolute inset-0 px-3 py-3 font-sans whitespace-pre overflow-hidden pointer-events-none"
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
        className="bg-transparent font-sans px-3 py-3 outline-none border-none w-full relative z-10" 
        spellCheck={false}
        style={{ 
          color: 'transparent', 
          caretColor: '#cccccc' 
        }}
      />
    </div>
  );
}

export function RequestPanel({ method, setMethod, url, setUrl, loading, onSend, onSave }: RequestPanelProps) {
  const getMethodColor = (m: string) => {
    switch(m) {
      case 'GET': return 'text-vsc-http-get';
      case 'POST': return 'text-vsc-http-post';
      case 'PUT': return 'text-vsc-http-put';
      case 'PATCH': return 'text-vsc-http-patch';
      case 'DELETE': return 'text-vsc-http-delete';
      default: return 'text-vsc-foreground';
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex flex-grow items-stretch border border-vsc-panel-border rounded bg-transparent focus-within:border-vsc-focus focus-within:outline focus-within:outline-1 focus-within:outline-vsc-focus">
        <div className="flex items-center border-r border-vsc-panel-border relative">
          <select 
            value={method} 
            onChange={e => setMethod(e.target.value)}
            className={`bg-transparent font-bold cursor-pointer outline-none border-none pl-3 pr-7 py-3 appearance-none h-full ${getMethodColor(method)}`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
          <ChevronDown className="absolute right-2 text-gray-400 pointer-events-none" size={16} />
        </div>
        <HighlightedInput value={url} onChange={setUrl} placeholder="Enter URL or paste text" />
      </div>
      <div className="flex bg-[#2a2d2e] rounded overflow-hidden">
        <button 
          onClick={onSend}
          disabled={loading}
          className="bg-vsc-postman-blue text-white py-3 px-6 font-bold hover:bg-vsc-postman-hover border-none cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
        {onSave && (
          <button 
            onClick={onSave}
            className="bg-vsc-postman-blue border-l border-[#1a60ad] text-white py-3 px-3 hover:bg-vsc-postman-hover cursor-pointer transition-colors flex items-center justify-center"
            title="Save Request"
          >
            <Save size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
