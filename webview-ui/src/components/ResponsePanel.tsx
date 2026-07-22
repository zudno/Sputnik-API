import Editor from '@monaco-editor/react';

interface ResponsePanelProps {
  response: any;
}

export function ResponsePanel({ response }: ResponsePanelProps) {
  if (!response) return null;

  const isSuccess = response.status >= 200 && response.status < 300;
  const responseSize = typeof response.data === 'object' 
    ? new TextEncoder().encode(JSON.stringify(response.data)).length 
    : new TextEncoder().encode(String(response.data)).length;
  
  const sizeText = responseSize > 1024 
    ? `${(responseSize / 1024).toFixed(2)} KB` 
    : `${responseSize} B`;

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
            <div className="flex items-center text-[13px] mb-3 px-1 ml-auto justify-end gap-2 font-sans">
              <span className={`font-semibold px-2 py-0.5 rounded text-[12px] ${isSuccess ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-gray-500">&middot;</span>
              <span className="text-gray-400">
                {response.time} ms
              </span>
              <span className="text-gray-500">&middot;</span>
              <span className="text-gray-400">
                {sizeText}
              </span>
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
