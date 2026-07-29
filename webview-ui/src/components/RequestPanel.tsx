import { Save } from "lucide-react";
import { MethodDropdown } from "./ui/MethodDropdown";
import { HighlightedInput } from "./ui/HighlightedInput";

interface RequestPanelProps {
  method: string;
  setMethod: (method: string) => void;
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  onSend: () => void;
  onSave?: () => void;
  availableVariables: Set<string>;
}

export function RequestPanel({ method, setMethod, url, setUrl, loading, onSend, onSave, availableVariables }: RequestPanelProps) {
  return (
    <div className="flex gap-2">
      <div className="flex flex-grow items-stretch border border-vsc-panel-border rounded bg-transparent focus-within:border-vsc-focus focus-within:outline focus-within:outline-1 focus-within:outline-vsc-focus">
        <div className="flex items-center border-r border-vsc-panel-border relative">
          <MethodDropdown method={method} setMethod={setMethod} />
        </div>
        <HighlightedInput value={url} onChange={setUrl} placeholder="Enter URL or paste text" availableVariables={availableVariables} />
      </div>
      <div className="flex bg-[#2a2d2e] rounded overflow-hidden">
        <button 
          onClick={onSend}
          disabled={loading}
          className="bg-vsc-postman-blue text-white py-2.5 px-6 font-bold hover:bg-vsc-postman-hover border-none cursor-pointer transition-colors disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
        {onSave && (
          <button 
            onClick={onSave}
            className="bg-vsc-postman-blue border-l border-[#1a60ad] text-white py-2.5 px-3 hover:bg-vsc-postman-hover cursor-pointer transition-colors flex items-center justify-center"
            title="Save Request"
          >
            <Save size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
