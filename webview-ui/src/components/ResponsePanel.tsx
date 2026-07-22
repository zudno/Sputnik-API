interface ResponsePanelProps {
  response: any;
}

export function ResponsePanel({ response }: ResponsePanelProps) {
  if (!response) return null;

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-2 flex-shrink-0">Response</h3>
      <div className="border border-vsc-panel-border rounded p-3 overflow-auto flex-grow bg-vsc-editor-bg">
        {response.error ? (
          <>
            <div className="font-bold mb-2 text-vsc-error">Error</div>
            <pre className="font-mono text-sm whitespace-pre-wrap break-all">{response.error}</pre>
          </>
        ) : (
          <>
            <div className={`font-bold mb-2 ${response.status >= 200 && response.status < 300 ? 'text-vsc-success' : 'text-vsc-error'}`}>
              Status: {response.status} {response.statusText} | Time: {response.time}ms
            </div>
            <pre className="font-mono text-sm whitespace-pre-wrap break-all">
              {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}
