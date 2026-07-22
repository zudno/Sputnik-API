import Editor from '@monaco-editor/react';
import { useState } from 'react';

interface BodyPanelProps {
  body: string;
  setBody: (body: string) => void;
}

export function BodyPanel({ body, setBody }: BodyPanelProps) {
  const [language, setLanguage] = useState('json');

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-2 text-[13px]">
        <div className="flex items-center gap-1">
          <input type="radio" id="raw" name="body-type" defaultChecked className="accent-vsc-button-bg cursor-pointer" />
          <label htmlFor="raw" className="cursor-pointer">raw</label>
        </div>
        
        <select 
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-transparent border-none text-blue-500 font-semibold text-[13px] cursor-pointer outline-none hover:text-blue-400"
        >
          <option value="text">Text</option>
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="html">HTML</option>
        </select>
      </div>
      
      <div className="flex-grow min-h-[150px] border border-vsc-panel-border rounded overflow-hidden">
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
      </div>
    </div>
  );
}
