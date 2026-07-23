import { useState, useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { RequestPanel } from "./components/RequestPanel";
import { RequestTabs } from "./components/RequestTabs";
import { ResponsePanel } from "./components/ResponsePanel";
import type { HeaderItem } from "./types";

// @ts-ignore
const vscode = acquireVsCodeApi();

function App() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState<HeaderItem[]>([
    { id: '1', key: '', value: '', description: '', enabled: true }
  ]);
  const [body, setBody] = useState("");
  
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'response') {
        setLoading(false);
        setResponse(message.data);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSend = () => {
    setLoading(true);
    setResponse(null);
    
    // Serialize headers to string for backend
    const headersString = headers
      .filter(h => h.enabled && h.key.trim() !== '')
      .map(h => `${h.key.trim()}: ${h.value}`)
      .join('\n');

    vscode.postMessage({
      command: 'sendRequest',
      data: {
        method,
        url,
        headers: headersString,
        body
      }
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-vsc-foreground bg-vsc-editor-bg">
      <div className="p-5 pb-2 flex-shrink-0 flex flex-col gap-4">
        <h2 className="text-xl font-bold">Sputnik API</h2>
        
        <RequestPanel 
          method={method} 
          setMethod={setMethod} 
          url={url} 
          setUrl={setUrl} 
          loading={loading} 
          onSend={handleSend} 
        />
      </div>

      <Group orientation="vertical" className="flex-grow">
        <Panel defaultSize={45} minSize={30} className="flex flex-col">
          <div className="px-5 h-full overflow-hidden flex flex-col">
            <RequestTabs 
              headers={headers}
              setHeaders={setHeaders}
              body={body}
              setBody={setBody}
            />
          </div>
        </Panel>

        <Separator className="h-2 cursor-row-resize my-1 group relative flex items-center justify-center">
          <div className="h-[1px] w-full mx-5 transition-colors bg-vsc-panel-border group-hover:bg-vsc-focus group-active:bg-vsc-focus"></div>
        </Separator>

        <Panel defaultSize={55} minSize={20} className="flex flex-col">
          <div className="px-5 pb-5 h-full overflow-auto flex flex-col">
            <ResponsePanel 
              response={response} 
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

export default App;
