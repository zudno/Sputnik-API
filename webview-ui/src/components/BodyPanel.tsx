import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';

interface BodyPanelProps {
  body: string;
  setBody: (body: string) => void;
}

export function BodyPanel({ body, setBody }: BodyPanelProps) {
  const [language, setLanguage] = useState('json');
  const [bodyType, setBodyType] = useState('raw');

  const languages = [
    { value: 'text', label: 'Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'json', label: 'JSON' },
    { value: 'html', label: 'HTML' },
    { value: 'xml', label: 'XML' },
  ];

  const selectedLabel = languages.find(l => l.value === language)?.label || 'JSON';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-4 text-[13px]">
        <div className="flex items-center gap-4 text-vsc-foreground">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="body-type" 
              value="none"
              checked={bodyType === 'none'}
              onChange={() => {
                setBodyType('none');
                setBody('');
              }}
              className="appearance-none w-3.5 h-3.5 rounded-full border border-[#888888] checked:border-[4px] checked:border-blue-500 checked:bg-white bg-transparent outline-none cursor-pointer m-0" 
            />
            none
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="body-type" 
              value="raw"
              checked={bodyType === 'raw'}
              onChange={() => setBodyType('raw')}
              className="appearance-none w-3.5 h-3.5 rounded-full border border-[#888888] checked:border-[4px] checked:border-blue-500 checked:bg-white bg-transparent outline-none cursor-pointer m-0" 
            />
            raw
          </label>
        </div>
        
        {bodyType === 'raw' && (
          <Dropdown 
            align="start"
            trigger={
              <button className="flex items-center gap-1 text-blue-500 font-semibold text-[13px] hover:text-blue-400 cursor-pointer bg-transparent border-none outline-none p-0">
                {selectedLabel}
                <ChevronDown size={14} strokeWidth={2.5} />
              </button>
            }
            items={languages.map(lang => ({
              label: lang.label,
              onClick: () => setLanguage(lang.value)
            }))}
          />
        )}
      </div>
      
      <div className="flex-grow min-h-0 border border-vsc-panel-border rounded overflow-hidden flex flex-col">
        {bodyType === 'none' ? (
          <div className="flex-grow flex items-center justify-center text-vsc-descriptionForeground text-[13px]">
            This request does not have a body
          </div>
        ) : (
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={body}
            onChange={(value) => setBody(value || '')}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 13,
              folding: true,
              lineNumbersMinChars: 3,
              formatOnPaste: true,
            }}
          />
        )}
      </div>
    </div>
  );
}
