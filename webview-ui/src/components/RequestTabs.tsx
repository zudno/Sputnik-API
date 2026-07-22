import { useState } from 'react';
import { HeadersPanel } from './HeadersPanel';
import { BodyPanel } from './BodyPanel';

interface RequestTabsProps {
  headers: string;
  setHeaders: (headers: string) => void;
  body: string;
  setBody: (body: string) => void;
}

export function RequestTabs({ headers, setHeaders, body, setBody }: RequestTabsProps) {
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 border-b border-vsc-panel-border pb-1">
        <button 
          onClick={() => setActiveTab('headers')}
          className={`bg-transparent border-none outline-none cursor-pointer pb-2 -mb-[5px] text-sm ${activeTab === 'headers' ? 'text-vsc-foreground font-semibold border-b-2 border-vsc-postman-blue' : 'text-gray-400 hover:text-vsc-foreground'}`}
        >
          Headers {headers.trim() ? '(1)' : ''}
        </button>
        <button 
          onClick={() => setActiveTab('body')}
          className={`bg-transparent border-none outline-none cursor-pointer pb-2 -mb-[5px] text-sm ${activeTab === 'body' ? 'text-vsc-foreground font-semibold border-b-2 border-vsc-postman-blue' : 'text-gray-400 hover:text-vsc-foreground'}`}
        >
          Body {body.trim() ? '(•)' : ''}
        </button>
      </div>
      
      <div className="mt-2">
        {activeTab === 'headers' && (
          <HeadersPanel 
            headers={headers} 
            setHeaders={setHeaders} 
          />
        )}
        
        {activeTab === 'body' && (
          <BodyPanel 
            body={body} 
            setBody={setBody} 
          />
        )}
      </div>
    </div>
  );
}
