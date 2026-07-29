import { useState } from 'react';
import { HeadersPanel } from './HeadersPanel';
import { BodyPanel } from './BodyPanel';
import type { HeaderItem } from '../types';

interface RequestTabsProps {
  headers: HeaderItem[];
  setHeaders: (headers: HeaderItem[]) => void;
  body: string;
  setBody: (body: string) => void;
  bodyType: string;
  setBodyType: (val: string) => void;
  rawBodyType: string;
  setRawBodyType: (val: string) => void;
  availableVariables: Set<string>;
}

export function RequestTabs({ headers, setHeaders, body, setBody, bodyType, setBodyType, rawBodyType, setRawBodyType, availableVariables }: RequestTabsProps) {
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('headers');

  const activeHeadersCount = headers.filter(h => h.key.trim() !== '').length;

  return (
    <div className="flex flex-col mt-2 flex-grow overflow-hidden">
      <div className="flex gap-6 shrink-0">
        <button 
          onClick={() => setActiveTab('headers')}
          className={`bg-transparent outline-none cursor-pointer pb-2 px-1 text-[13px] border-b-2 ${activeTab === 'headers' ? 'text-vsc-foreground font-semibold border-blue-500' : 'text-gray-400 border-transparent hover:text-vsc-foreground'}`}
        >
          <span className="flex items-center gap-1.5">
            Headers 
            {activeHeadersCount > 0 && <span className="text-[#0cbb52] font-normal">({activeHeadersCount})</span>}
          </span>
        </button>
        <button 
          onClick={() => setActiveTab('body')}
          className={`bg-transparent outline-none cursor-pointer pb-2 px-1 text-[13px] border-b-2 ${activeTab === 'body' ? 'text-vsc-foreground font-semibold border-blue-500' : 'text-gray-400 border-transparent hover:text-vsc-foreground'}`}
        >
          <span className="flex items-center gap-1.5">
            Body 
            {body.trim() && <span className="w-[6px] h-[6px] rounded-full bg-[#0cbb52] inline-block"></span>}
          </span>
        </button>
      </div>
      
      <div className="mt-2 flex-grow overflow-hidden">
        {activeTab === 'headers' && (
          <HeadersPanel 
            headers={headers} 
            setHeaders={setHeaders} 
            availableVariables={availableVariables}
          />
        )}
        
        {activeTab === 'body' && (
          <BodyPanel 
            body={body} 
            setBody={setBody}
            bodyType={bodyType}
            setBodyType={setBodyType}
            rawBodyType={rawBodyType}
            setRawBodyType={setRawBodyType}
            availableVariables={availableVariables}
          />
        )}
      </div>
    </div>
  );
}
