import Editor from '@monaco-editor/react';

interface ResponsePanelProps {
  response: any;
}

export function ResponsePanel({ response }: ResponsePanelProps) {
  if (!response) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="rounded py-3 flex flex-col flex-grow bg-vsc-editor-bg h-full">
        {response.error ? (
          <>
            <div className="font-bold mb-2 text-vsc-error">Error</div>
            <pre className="font-mono text-sm whitespace-pre-wrap break-all">{response.error}</pre>
          </>
        ) : (
          <>
            <div className={`font-bold mb-2 px-1 ${response.status >= 200 && response.status < 300 ? 'text-vsc-success' : 'text-vsc-error'}`}>
              Status: {response.status} {response.statusText} | Time: {response.time}ms
            </div>
            <div className="flex-grow min-h-0 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontSize: 13,
                  lineNumbersMinChars: 3,
                  folding: true
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
