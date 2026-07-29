import Editor from '@monaco-editor/react';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';

interface BodyPanelProps {
  body: string;
  setBody: (body: string) => void;
  bodyType: string;
  setBodyType: (val: string) => void;
  rawBodyType: string;
  setRawBodyType: (val: string) => void;
}

export function BodyPanel({ body, setBody, bodyType, setBodyType, rawBodyType, setRawBodyType }: BodyPanelProps) {
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [monacoInstance, setMonacoInstance] = useState<any>(null);
  const decorationsRef = useRef<any>(null);

  useEffect(() => {
    if (!editorInstance) return;

    const handleCopy = (e: ClipboardEvent) => {
      if (editorInstance.hasTextFocus()) {
        const selection = editorInstance.getSelection();
        const text = editorInstance.getModel().getValueInRange(selection);
        if (text) {
          e.clipboardData?.setData('text/plain', text);
          e.preventDefault();
        }
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      if (editorInstance.hasTextFocus()) {
        const selection = editorInstance.getSelection();
        const text = editorInstance.getModel().getValueInRange(selection);
        if (text) {
          e.clipboardData?.setData('text/plain', text);
          editorInstance.executeEdits('clipboard', [{ range: selection, text: '' }]);
          e.preventDefault();
        }
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (editorInstance.hasTextFocus()) {
        const text = e.clipboardData?.getData('text/plain');
        if (text) {
          const selection = editorInstance.getSelection();
          editorInstance.executeEdits('clipboard', [{
            range: selection,
            text: text,
            forceMoveMarkers: true
          }]);
          e.preventDefault();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Capturar los atajos de teclado nativos antes de que lleguen a Monaco
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'x')) {
        e.stopPropagation();
      }
    };

    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editorInstance]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
    setMonacoInstance(monaco);
    decorationsRef.current = editor.createDecorationsCollection();
  };

  useEffect(() => {
    if (!editorInstance || !monacoInstance || !decorationsRef.current) return;

    const model = editorInstance.getModel();
    if (!model) return;

    const text = model.getValue();
    const regex = /\{\{[^}]+\}\}/g;
    let match;
    const newDecorations = [];

    while ((match = regex.exec(text)) !== null) {
      const startPos = model.getPositionAt(match.index);
      const endPos = model.getPositionAt(match.index + match[0].length);
      
      newDecorations.push({
        range: new monacoInstance.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column),
        options: {
          inlineClassName: 'monaco-env-variable',
          stickiness: 1 // TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
      });
    }

    decorationsRef.current.set(newDecorations);
  }, [body, editorInstance, monacoInstance]);

  const languages = [
    { value: 'text', label: 'Text' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'json', label: 'JSON' },
    { value: 'html', label: 'HTML' },
    { value: 'xml', label: 'XML' },
  ];

  const selectedLabel = languages.find(l => l.value === rawBodyType)?.label || 'JSON';

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
              onClick: () => setRawBodyType(lang.value)
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
            language={rawBodyType}
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
            onMount={handleEditorDidMount}
          />
        )}
      </div>
    </div>
  );
}
