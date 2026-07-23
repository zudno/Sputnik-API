import Editor from '@monaco-editor/react';
import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

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
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-1 text-blue-500 font-semibold text-[13px] hover:text-blue-400 cursor-pointer bg-transparent border-none outline-none p-0">
                {selectedLabel}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </DropdownMenu.Trigger>
            
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={5} className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-md shadow-2xl py-1.5 z-50 w-[180px]">
                {languages.map((lang) => (
                  <DropdownMenu.Item 
                    key={lang.value}
                    onSelect={() => setLanguage(lang.value)}
                    className="px-3 py-1.5 mx-1.5 my-0.5 rounded-md cursor-pointer text-[13px] font-sans outline-none text-[#cccccc] focus:bg-[#333333] focus:text-white transition-colors"
                  >
                    {lang.label}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </div>
      
      <div className="flex-grow min-h-[150px] border border-vsc-panel-border rounded overflow-hidden flex flex-col">
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
