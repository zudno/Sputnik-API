import { useState, useEffect } from 'react';
import { vscode } from '../utils/vscode';
import { Plus, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';

export function Sidebar() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'collectionsUpdated') {
        setCollections(message.collections);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Solicitar estado inicial
    vscode.postMessage({ command: 'getCollections' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleAddCollection = () => {
    const name = prompt('Nombre de la nueva colección');
    if (name) {
      vscode.postMessage({ command: 'addCollection', name });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-[#cccccc] text-[13px] select-none">
      <div className="flex justify-between items-center px-4 py-3 font-semibold text-xs border-b border-[#2b2d2e]">
        <span>COLLECTIONS</span>
        <button 
          onClick={handleAddCollection} 
          className="hover:text-white cursor-pointer w-6 h-6 flex items-center justify-center rounded hover:bg-[#2a2d2e]"
          title="New Collection"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {collections.map(c => (
          <CollectionItem key={c.id} collection={c} />
        ))}
        {collections.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No collections yet. Click + to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function CollectionItem({ collection }: { collection: any }) {
  const [expanded, setExpanded] = useState(true);

  const handleDelete = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (confirm(`¿Eliminar colección '${collection.name}'?`)) {
      vscode.postMessage({ command: 'deleteCollection', id: collection.id });
    }
  };

  const handleRename = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    const newName = prompt('Nuevo nombre:', collection.name);
    if (newName && newName !== collection.name) {
      vscode.postMessage({ command: 'renameCollection', id: collection.id, name: newName });
    }
  };

  const handleAddRequest = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    const name = prompt('Nombre de la petición:');
    if (name) {
      vscode.postMessage({ command: 'addRequest', collectionId: collection.id, name });
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        className="flex justify-between items-center py-1 px-3 hover:bg-[#2a2d2e] group cursor-pointer transition-colors" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <span className="truncate">{collection.name}</span>
        </div>
        
        <div className="flex items-center">
          <Dropdown
            align="end"
            trigger={
              <button 
                onClick={(e) => e.stopPropagation()}
                className="w-6 h-6 flex items-center justify-center hover:bg-[#3c3e40] rounded text-gray-400 hover:text-white invisible group-hover:visible transition-colors outline-none border-none bg-transparent cursor-pointer"
              >
                <MoreHorizontal size={16} />
              </button>
            }
            items={[
              { label: 'Add Request', onClick: handleAddRequest },
              { label: 'Rename', onClick: handleRename },
              { label: 'Delete', onClick: handleDelete, danger: true }
            ]}
          />
        </div>
      </div>
      
      {expanded && (
        <div className="flex flex-col relative">
          {/* Vertical guideline */}
          <div className="absolute left-[20px] top-0 bottom-0 w-[1px] bg-[#3a3d3e] z-10 pointer-events-none"></div>
          {collection.requests.map((r: any) => (
             <RequestItem key={r.id} request={r} collectionId={collection.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestItem({ request, collectionId }: { request: any, collectionId: string }) {
  
  const getMethodColor = (m: string) => {
    switch(m.toUpperCase()) {
      case 'GET': return 'text-[#0cbb52]';
      case 'POST': return 'text-[#ffb400]';
      case 'PUT': return 'text-[#097bed]';
      case 'PATCH': return 'text-[#e3a005]';
      case 'DELETE': return 'text-[#eb2013]';
      default: return 'text-gray-400';
    }
  };

  const formatMethod = (m: string) => {
    const upper = m.toUpperCase();
    return upper === 'DELETE' ? 'DEL' : upper;
  };

  const handleOpen = () => {
    vscode.postMessage({ 
      command: 'openRequest', 
      collectionId, 
      requestId: request.id 
    });
  };

  const handleDelete = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (confirm(`¿Eliminar petición '${request.name}'?`)) {
      vscode.postMessage({ command: 'deleteRequest', collectionId, requestId: request.id });
    }
  };

  const handleRename = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    const newName = prompt('Nuevo nombre:', request.name);
    if (newName && newName !== request.name) {
      vscode.postMessage({ command: 'renameRequest', collectionId, requestId: request.id, name: newName });
    }
  };

  const method = request.requestData?.method || 'GET';

  return (
    <div 
      className="flex justify-between items-center py-1 pl-[36px] pr-3 hover:bg-[#2a2d2e] group cursor-pointer transition-colors relative z-0 w-full"
      onClick={handleOpen}
    >
      <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap">
        <span className={`text-[9px] font-semibold w-[26px] ${getMethodColor(method)}`}>
          {formatMethod(method)}
        </span>
        <span className="truncate">{request.name}</span>
      </div>
      
      <div className="flex items-center">
        <Dropdown
          align="end"
          trigger={
            <button 
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 flex items-center justify-center hover:bg-[#3c3e40] rounded text-gray-400 hover:text-white invisible group-hover:visible transition-colors outline-none border-none bg-transparent cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>
          }
          items={[
            { label: 'Rename', onClick: handleRename },
            { label: 'Delete', onClick: handleDelete, danger: true }
          ]}
        />
      </div>
    </div>
  );
}
