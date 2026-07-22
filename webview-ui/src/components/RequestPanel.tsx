import { ChevronDown } from "lucide-react";

interface RequestPanelProps {
  method: string;
  setMethod: (method: string) => void;
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  onSend: () => void;
}

export function RequestPanel({ method, setMethod, url, setUrl, loading, onSend }: RequestPanelProps) {
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
        <input 
          type="text" 
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="bg-transparent text-vsc-input-foreground flex-grow font-mono px-3 py-3 outline-none border-none w-full" 
          placeholder="https://api.example.com/data" 
        />
      </div>
      <button 
        onClick={onSend}
        disabled={loading}
        className="bg-vsc-postman-blue text-white py-3 px-6 font-bold hover:bg-vsc-postman-hover border-none cursor-pointer rounded transition-colors disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}
