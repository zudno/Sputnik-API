import { useState, useEffect } from 'react';
import { vscode } from '../utils/vscode';
import { Plus, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';

interface DragState {
  draggedRequestId: string | null;
  dragOverInfo: { id: string, position: 'top' | 'bottom' | 'inside' } | null;
  handleDragStart: (id: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (id: string, position: 'top' | 'bottom' | 'inside') => void;
  handleDrop: (targetId: string, position: 'top' | 'bottom' | 'inside', targetCollectionId: string) => void;
}

export function Sidebar() {
  const [collections, setCollections] = useState<any[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string, position: 'top' | 'bottom' | 'inside' } | null>(null);

  const handleDragStart = (id: string) => setDraggedRequestId(id);
  const handleDragEnd = () => {
    setDraggedRequestId(null);
    setDragOverInfo(null);
  };
  const handleDragOver = (id: string, position: 'top' | 'bottom' | 'inside') => {
    setDragOverInfo({ id, position });
  };
  const handleDrop = (targetId: string, position: 'top' | 'bottom' | 'inside', targetCollectionId: string) => {
    if (draggedRequestId && draggedRequestId !== targetId) {
      let targetIndex = undefined;
      const targetCol = collections.find(c => c.id === targetCollectionId);
      if (targetCol && position !== 'inside') {
          const idx = targetCol.requests.findIndex((r: any) => r.id === targetId);
          if (idx !== -1) {
              targetIndex = position === 'top' ? idx : idx + 1;
          }
      }
      let sourceCollectionId = '';
      for (const col of collections) {
          if (col.requests.some((r: any) => r.id === draggedRequestId)) {
              sourceCollectionId = col.id;
              break;
          }
      }
      vscode.postMessage({ 
        command: 'moveRequest', 
        requestId: draggedRequestId, 
        sourceCollectionId, 
        targetCollectionId, 
        targetIndex 
      });
    }
    handleDragEnd();
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'collectionsUpdated') {
        setCollections(message.collections);
        if (message.activeRequestId !== undefined) {
          setActiveRequestId(message.activeRequestId);
        }
      } else if (message.command === 'setActiveRequest') {
        setActiveRequestId(message.id);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Solicitar estado inicial
    vscode.postMessage({ command: 'getCollections' });

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleAddCollection = () => {
    vscode.postMessage({ command: 'addCollection', name: 'New Collection' });
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
          <CollectionItem 
            key={c.id} 
            collection={c} 
            activeRequestId={activeRequestId} 
            dragState={{ draggedRequestId, dragOverInfo, handleDragStart, handleDragEnd, handleDragOver, handleDrop }} 
          />
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

function CollectionItem({ collection, activeRequestId, dragState }: { collection: any, activeRequestId?: string | null, dragState: DragState }) {
  const [expanded, setExpanded] = useState(collection.expanded ?? true);

  const toggleExpanded = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    vscode.postMessage({ command: 'toggleCollectionExpanded', id: collection.id, expanded: newExpanded });
  };

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
    vscode.postMessage({ command: 'addRequest', collectionId: collection.id, name: 'New Request' });
  };

  return (
    <div className="flex flex-col">
      <div 
        className="flex justify-between items-center py-1 px-3 hover:bg-[#2a2d2e] group cursor-pointer transition-colors" 
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <span className="truncate">{collection.name}</span>
        </div>
        
        <div className="flex items-center gap-0.5">
          <button 
            onClick={handleAddRequest}
            title="Add Request"
            className="w-6 h-6 flex items-center justify-center hover:bg-[#3c3e40] rounded text-gray-400 hover:text-white invisible group-hover:visible transition-colors outline-none border-none bg-transparent cursor-pointer"
          >
            <Plus size={16} />
          </button>
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
      
      {expanded && (
        <div className="flex flex-col relative">
          {/* Vertical guideline */}
          <div className="absolute left-[20px] top-0 bottom-0 w-[1px] bg-[#3a3d3e] z-10 pointer-events-none"></div>
          {collection.requests && collection.requests.length > 0 ? (
            collection.requests.map((r: any) => (
               <RequestItem key={r.id} request={r} collectionId={collection.id} activeRequestId={activeRequestId} dragState={dragState} />
            ))
          ) : (
            <div 
              className={`flex flex-col py-2 pl-[36px] pr-3 text-gray-400 ${dragState.dragOverInfo?.id === collection.id ? 'bg-[#2a2d2e]' : ''}`}
              onDragOver={(e) => { e.preventDefault(); dragState.handleDragOver(collection.id, 'inside'); }}
              onDrop={(e) => { e.preventDefault(); dragState.handleDrop(collection.id, 'inside', collection.id); }}
            >
              <span className="mb-1">This collection is empty</span>
              <span>
                <button 
                  onClick={handleAddRequest}
                  className="text-blue-400 hover:text-blue-300 cursor-pointer border-none bg-transparent p-0 m-0 text-[13px] outline-none hover:underline"
                >
                  Add a request
                </button> to start working
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestItem({ request, collectionId, activeRequestId, dragState }: { request: any, collectionId: string, activeRequestId?: string | null, dragState: DragState }) {
  const isActive = request.id === activeRequestId;

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
      draggable
      onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          dragState.handleDragStart(request.id);
      }}
      onDragEnd={() => dragState.handleDragEnd()}
      onDragOver={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const position = y < rect.height / 2 ? 'top' : 'bottom';
          dragState.handleDragOver(request.id, position);
      }}
      onDrop={(e) => {
          e.preventDefault();
          if (dragState.dragOverInfo) {
              dragState.handleDrop(request.id, dragState.dragOverInfo.position, collectionId);
          }
      }}
      className={`flex justify-between items-center py-1 pl-[36px] pr-3 group cursor-pointer transition-colors relative z-0 w-full ${isActive ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'} ${dragState.draggedRequestId === request.id ? 'opacity-50' : ''}`}
      onClick={handleOpen}
    >
      {dragState.dragOverInfo?.id === request.id && dragState.dragOverInfo?.position === 'top' && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500 z-10 pointer-events-none" />
      )}
      {dragState.dragOverInfo?.id === request.id && dragState.dragOverInfo?.position === 'bottom' && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 z-10 pointer-events-none" />
      )}
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
