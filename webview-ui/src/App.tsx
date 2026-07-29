import { useState, useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { ChevronDown, Check } from "lucide-react";
import { RequestPanel } from "./components/RequestPanel";
import { RequestTabs } from "./components/RequestTabs";
import { ResponsePanel } from "./components/ResponsePanel";
import { Sidebar } from "./components/Sidebar";
import { Breadcrumb } from "./components/Breadcrumb";
import { EnvironmentPanel } from "./components/EnvironmentPanel";
import type { HeaderItem } from "./types";
import { vscode } from "./utils/vscode";
import { Dropdown } from "./components/ui/Dropdown";

const parseHeaders = (headersStr: string) => {
  const parsedHeaders: HeaderItem[] = [];
  if (headersStr) {
    headersStr.split('\n').forEach((line: string) => {
      const sep = line.indexOf(':');
      if (sep !== -1) {
        parsedHeaders.push({
          id: crypto.randomUUID(),
          key: line.substring(0, sep).trim(),
          value: line.substring(sep + 1).trim(),
          description: '',
          enabled: true
        });
      }
    });
  }
  parsedHeaders.push({ id: crypto.randomUUID(), key: '', value: '', description: '', enabled: true });
  return parsedHeaders;
};

function EnvironmentSelector({ environments, activeEnvironmentId }: { environments: any[], activeEnvironmentId: string | null }) {
  const activeEnv = environments.find(e => e.id === activeEnvironmentId);
  
  const trigger = (
    <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-transparent hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white cursor-pointer text-[13px] font-sans outline-none border border-[#2b2d2e] transition-colors">
      <span className="truncate max-w-[150px]">{activeEnv ? activeEnv.name : 'No Environment'}</span>
      <ChevronDown size={14} className="text-gray-400" />
    </button>
  );

  const items = [
    { 
      label: 'No Environment', 
      onClick: (e: any) => { e?.preventDefault(); vscode.postMessage({ command: 'setActiveEnvironment', id: null }); },
      icon: activeEnvironmentId === null ? <Check size={14} className="text-gray-400" /> : <div className="w-3.5 h-3.5" />
    },
    ...environments.map(env => ({
      label: env.name,
      onClick: (e: any) => { e?.preventDefault(); vscode.postMessage({ command: 'setActiveEnvironment', id: env.id }); },
      icon: activeEnvironmentId === env.id ? <Check size={14} className="text-gray-400" /> : <div className="w-3.5 h-3.5" />
    }))
  ];

  return <Dropdown trigger={trigger} items={items} align="end" />;
}

function MainPanel() {
  // @ts-ignore
  const vscodeData = window.vscodeData || {};
  const initialView = vscodeData.view || 'request';
  const initialData = vscodeData.initialData || {};

  const [view, setView] = useState<'request' | 'environment'>(initialView);
  const [environmentName, setEnvironmentName] = useState<string>(initialData.name || 'Globals');
  const [environmentId, setEnvironmentId] = useState<string>(initialData.id || 'Globals');
  
  const [method, setMethod] = useState(initialData.requestData?.method || "GET");
  const [url, setUrl] = useState(initialData.requestData?.url || "");
  const [headers, setHeaders] = useState<HeaderItem[]>(() => parseHeaders(initialData.requestData?.headers || ""));
  const [body, setBody] = useState(initialData.requestData?.body || "");
  
  const [initialVariables, setInitialVariables] = useState<any[]>(initialData.variables || []);
  
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [environments, setEnvironments] = useState<any[]>(initialData.environments || []);
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(initialData.activeEnvironmentId || null);
  
  const [requestMeta, setRequestMeta] = useState<{name?: string, collectionName?: string, collectionId?: string, requestId?: string, path?: {id: string, name: string}[]}>(initialData.meta || {});

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'response') {
        setLoading(false);
        setResponse(message.data);
      } else if (message.command === 'loadEnvironment') {
        setView('environment');
        setEnvironmentName(message.data?.name || 'Globals');
        setEnvironmentId(message.data?.id || 'Globals');
        if (message.data?.variables) {
          setInitialVariables(message.data.variables);
        }
      } else if (message.command === 'loadRequest') {
        setView('request');
        setRequestMeta(message.meta || {});
        const req = message.data;
        setMethod(req.method || 'GET');
        setUrl(req.url || '');
        setBody(req.body || '');
        setHeaders(parseHeaders(req.headers || ''));
        setResponse(null); // Clear previous response when loading
      } else if (message.command === 'environmentsUpdated') {
        if (message.environments !== undefined) {
          setEnvironments(message.environments);
        }
        if (message.activeEnvironmentId !== undefined) {
          setActiveEnvironmentId(message.activeEnvironmentId);
        }
      } else if (message.command === 'updateMetaPath') {
        setRequestMeta(prev => ({
          ...prev,
          path: message.meta.path,
          collectionName: message.meta.collectionName,
          name: message.meta.name !== undefined ? message.meta.name : prev.name
        }));
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

  const handleSave = () => {
    const headersString = headers
      .filter(h => h.enabled && h.key.trim() !== '')
      .map(h => `${h.key.trim()}: ${h.value}`)
      .join('\\n');

    vscode.postMessage({
      command: 'saveRequest',
      data: {
        method,
        url,
        headers: headersString,
        body
      }
    });
  };

  if (view === 'environment') {
    return <EnvironmentPanel environmentId={environmentId} environmentName={environmentName} initialVariables={initialVariables} />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden text-vsc-foreground bg-vsc-editor-bg">
      <div className="flex-shrink-0 flex flex-col">
        <div className="flex justify-between items-center w-full px-4 py-2 border-b border-vsc-panel-border">
          <Breadcrumb requestMeta={requestMeta} setRequestMeta={setRequestMeta} />
          <EnvironmentSelector environments={environments} activeEnvironmentId={activeEnvironmentId} />
        </div>
        
        <div className="px-4 pt-4 pb-2">
          <RequestPanel 
            method={method} 
            setMethod={setMethod} 
            url={url} 
            setUrl={setUrl} 
            loading={loading} 
            onSend={handleSend} 
            onSave={handleSave}
          />
        </div>
      </div>

      <Group orientation="vertical" className="flex-grow">
        <Panel defaultSize={45} minSize={30} className="flex flex-col">
          <div className="px-4 h-full overflow-hidden flex flex-col">
            <RequestTabs 
              headers={headers}
              setHeaders={setHeaders}
              body={body}
              setBody={setBody}
            />
          </div>
        </Panel>

        <Separator className="h-2 cursor-row-resize my-1 group relative flex items-center justify-center">
          <div className="h-[1px] w-full mx-0 transition-colors bg-vsc-panel-border group-hover:bg-vsc-focus group-active:bg-vsc-focus"></div>
        </Separator>

        <Panel defaultSize={55} minSize={20} className="flex flex-col">
          <div className="px-4 pb-3 h-full overflow-auto flex flex-col">
            <ResponsePanel 
              response={response} 
            />
          </div>
        </Panel>
      </Group>
    </div>
  );
}

function App() {
  // @ts-ignore
  const mode = window.vscodeData?.mode || 'panel';
  
  if (mode === 'sidebar') {
    return <Sidebar />;
  }
  
  return <MainPanel />;
}

export default App;
