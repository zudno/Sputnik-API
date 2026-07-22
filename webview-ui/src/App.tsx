import { useState, useEffect } from "react";
import { RequestPanel } from "./components/RequestPanel";
import { HeadersPanel } from "./components/HeadersPanel";
import { BodyPanel } from "./components/BodyPanel";
import { ResponsePanel } from "./components/ResponsePanel";

// @ts-ignore
const vscode = acquireVsCodeApi();

function App() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState("");
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
    vscode.postMessage({
      command: 'sendRequest',
      data: {
        method,
        url,
        headers,
        body
      }
    });
  };

  return (
    <div className="p-5 flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-2">Sputnik API</h2>
      
      <RequestPanel 
        method={method} 
        setMethod={setMethod} 
        url={url} 
        setUrl={setUrl} 
        loading={loading} 
        onSend={handleSend} 
      />

      <HeadersPanel 
        headers={headers} 
        setHeaders={setHeaders} 
      />

      <BodyPanel 
        body={body} 
        setBody={setBody} 
      />

      <ResponsePanel 
        response={response} 
      />
    </div>
  );
}

export default App;
