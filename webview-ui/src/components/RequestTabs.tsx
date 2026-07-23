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
    <div className="flex flex-col mt-2 flex-grow overflow-hidden">
      <div className="flex gap-6 shrink-0">
        <button 
          onClick={() => setActiveTab('headers')}
          className={`bg-transparent outline-none cursor-pointer pb-2 px-1 text-[13px] border-b-2 ${activeTab === 'headers' ? 'text-vsc-foreground font-semibold border-blue-500' : 'text-gray-400 border-transparent hover:text-vsc-foreground'}`}
        >
          Headers {headers.trim() ? '(1)' : ''}
        </button>
        <button 
          onClick={() => setActiveTab('body')}
          className={`bg-transparent outline-none cursor-pointer pb-2 px-1 text-[13px] border-b-2 ${activeTab === 'body' ? 'text-vsc-foreground font-semibold border-blue-500' : 'text-gray-400 border-transparent hover:text-vsc-foreground'}`}
        >
          Body {body.trim() ? '(•)' : ''}
        </button>
      </div>
      
      <div className="mt-2 flex-grow overflow-hidden">
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
