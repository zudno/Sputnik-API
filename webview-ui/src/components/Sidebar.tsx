import { useState, useEffect } from 'react';
import { vscode } from '../utils/vscode';
import { Plus, ChevronRight, MoreHorizontal, Archive, LayoutTemplate, History, Check, Search } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'collections' | 'environments'>('collections');
  const [collections, setCollections] = useState<any[]>([]);
  const [environments, setEnvironments] = useState<any[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string | null>(null);
  const [draggedRequestId, setDraggedRequestId] = useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ id: string, position: 'top' | 'bottom' | 'inside' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        if (message.environments !== undefined) {
          setEnvironments(message.environments);
        }
        if (message.activeEnvironmentId !== undefined) {
          setActiveEnvironmentId(message.activeEnvironmentId);
        }
      } else if (message.command === 'environmentsUpdated') {
        if (message.environments !== undefined) {
          setEnvironments(message.environments);
        }
        if (message.activeEnvironmentId !== undefined) {
          setActiveEnvironmentId(message.activeEnvironmentId);
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

  const filteredCollections = collections.map(c => {
    if (!searchQuery) return c;
    const query = searchQuery.toLowerCase();
    const matchesCollection = c.name.toLowerCase().includes(query);
    const matchedRequests = c.requests.filter((r: any) => r.name.toLowerCase().includes(query));
    
    if (matchesCollection || matchedRequests.length > 0) {
      return { 
        ...c, 
        requests: !matchesCollection && matchedRequests.length > 0 ? matchedRequests : c.requests,
        forceExpand: true
      };
    }
    return null;
  }).filter(Boolean);

  const filteredEnvironments = environments.filter(env => 
    !searchQuery || env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden text-[#cccccc] text-[13px] select-none">
      <div className="px-3 py-3 shrink-0">
        <div className="flex w-full bg-transparent border border-[#2b2d2e] rounded h-[32px] overflow-hidden">
          <button
            onClick={() => setActiveTab('collections')}
            className={`flex-1 flex justify-center items-center cursor-pointer outline-none transition-colors border-none m-0 p-0 h-full ${
              activeTab === 'collections' 
                ? 'bg-[#2a2d2e] text-[#e0e0e0]' 
                : 'bg-transparent text-gray-500 hover:bg-[#202223] hover:text-gray-300'
            }`}
            title="Collections"
          >
            <Archive size={15} strokeWidth={2} />
          </button>
          <div className="w-[1px] bg-[#2b2d2e]"></div>
          <button
            onClick={() => setActiveTab('environments')}
            className={`flex-1 flex justify-center items-center cursor-pointer outline-none transition-colors border-none m-0 p-0 h-full ${
              activeTab === 'environments' 
                ? 'bg-[#2a2d2e] text-[#e0e0e0]' 
                : 'bg-transparent text-gray-500 hover:bg-[#202223] hover:text-gray-300'
            }`}
            title="Environments"
          >
            <LayoutTemplate size={15} strokeWidth={2} />
          </button>
          <div className="w-[1px] bg-[#2b2d2e]"></div>
          <button
            className="flex-1 flex justify-center items-center cursor-pointer outline-none transition-colors border-none m-0 p-0 h-full bg-transparent text-gray-500 hover:bg-[#202223] hover:text-gray-300"
            title="History"
          >
            <History size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {activeTab === 'collections' ? (
        <>
          <div className="flex justify-between items-center px-4 py-2 font-semibold text-xs border-b border-[#2b2d2e] shrink-0">
            <span>COLLECTIONS</span>
            <button 
              onClick={handleAddCollection} 
              className="hover:text-white cursor-pointer w-6 h-6 flex items-center justify-center rounded hover:bg-[#2a2d2e] bg-transparent border-none text-[#cccccc]"
              title="New Collection"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="px-3 py-2 shrink-0">
            <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2b2d2e] rounded px-2 py-1.5 focus-within:border-[#007fd4] transition-colors">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input 
                type="text"
                placeholder="Search collections"
                className="bg-transparent text-[#cccccc] text-[12px] outline-none w-full border-none p-0 m-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            {filteredCollections.map(c => (
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
        </>
      ) : (
        <>
          <div className="flex justify-between items-center px-4 py-2 font-semibold text-xs border-b border-[#2b2d2e] shrink-0">
            <span>ENVIRONMENTS</span>
            <button 
              onClick={() => vscode.postMessage({ command: 'addEnvironment', name: 'New Environment' })} 
              className="hover:text-white cursor-pointer w-6 h-6 flex items-center justify-center rounded hover:bg-[#2a2d2e] bg-transparent border-none text-[#cccccc]"
              title="New Environment"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="px-3 py-2 shrink-0">
            <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2b2d2e] rounded px-2 py-1.5 focus-within:border-[#007fd4] transition-colors">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input 
                type="text"
                placeholder="Search environments"
                className="bg-transparent text-[#cccccc] text-[12px] outline-none w-full border-none p-0 m-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            {(!searchQuery || 'globals'.includes(searchQuery.toLowerCase())) && (
              <>
                <div 
                  className={`flex justify-between items-center py-2 px-4 hover:bg-[#2a2d2e] cursor-pointer transition-colors ${!activeEnvironmentId ? 'bg-[#37373d]' : ''}`}
              onClick={() => {
                vscode.postMessage({ command: 'openEnvironment', name: 'Globals', id: 'Globals' });
                vscode.postMessage({ command: 'setActiveEnvironment', id: null });
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[#cccccc]">Globals</span>
              </div>
              {!activeEnvironmentId && <Check size={16} className="text-gray-400" />}
            </div>
            
            <div className="h-[1px] bg-[#2b2d2e] mx-4 my-1"></div>
            </>
            )}

            {filteredEnvironments.map(env => (
              <EnvironmentItem key={env.id} env={env} activeEnvironmentId={activeEnvironmentId} />
            ))}

            {environments.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No custom environments yet. Click + to create one.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EnvironmentItem({ env, activeEnvironmentId }: { env: any, activeEnvironmentId: string | null }) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(env.name);

  const handleRenameClick = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(env.name);
  };

  const submitRename = () => {
    setIsRenaming(false);
    if (renameValue.trim() && renameValue !== env.name) {
       vscode.postMessage({ command: 'renameEnvironmentInline', id: env.id, name: renameValue.trim() });
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(env.name);
  };

  return (
    <div 
      className={`flex justify-between items-center py-2 px-4 hover:bg-[#2a2d2e] group cursor-pointer transition-colors ${activeEnvironmentId === env.id ? 'bg-[#37373d]' : ''}`}
      onClick={() => {
        if (isRenaming) return;
        vscode.postMessage({ command: 'openEnvironment', name: env.name, id: env.id });
        vscode.postMessage({ command: 'setActiveEnvironment', id: env.id });
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap flex-1 pr-2">
        {isRenaming ? (
          <input 
            type="text"
            autoFocus
            className="bg-[#1e1e1e] text-white border border-[#454545] px-1 text-[13px] outline-none w-full"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <span className="text-[13px] text-[#cccccc] truncate">{env.name}</span>
        )}
      </div>
      
      {!isRenaming && (
        <div className="flex items-center gap-2">
          <div className="invisible group-hover:visible">
            <Dropdown
              align="end"
              trigger={
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 flex items-center justify-center hover:bg-[#3c3e40] rounded text-gray-400 hover:text-white transition-colors outline-none border-none bg-transparent cursor-pointer"
                >
                  <MoreHorizontal size={16} />
                </button>
              }
              items={[
                { label: 'Rename', onClick: handleRenameClick },
                { label: 'Delete', onClick: (e) => { e?.stopPropagation(); vscode.postMessage({ command: 'deleteEnvironment', id: env.id }); }, danger: true }
              ]}
            />
          </div>
          {activeEnvironmentId === env.id && <Check size={16} className="text-gray-400" />}
        </div>
      )}
    </div>
  );
}

function CollectionItem({ collection, activeRequestId, dragState }: { collection: any, activeRequestId?: string | null, dragState: DragState }) {
  const [expanded, setExpanded] = useState(collection.expanded ?? true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(collection.name);

  const isExpanded = collection.forceExpand ? true : expanded;

  const toggleExpanded = () => {
    if (collection.forceExpand) return; // Disallow toggling when forced by search
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    vscode.postMessage({ command: 'toggleCollectionExpanded', id: collection.id, expanded: newExpanded });
  };

  const handleDelete = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    vscode.postMessage({ command: 'deleteCollection', id: collection.id });
  };

  const handleRenameClick = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(collection.name);
  };

  const submitRename = () => {
    setIsRenaming(false);
    if (renameValue.trim() && renameValue !== collection.name) {
       vscode.postMessage({ command: 'renameCollectionInline', id: collection.id, name: renameValue.trim() });
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(collection.name);
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
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap flex-1 pr-2">
          <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${collection.forceExpand ? 'opacity-50' : ''}`} />
          {isRenaming ? (
            <input 
              type="text"
              autoFocus
              className="bg-[#1e1e1e] text-white border border-[#454545] px-1 text-[13px] outline-none w-full"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') cancelRename();
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <span className="truncate">{collection.name}</span>
          )}
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
              { label: 'Rename', onClick: handleRenameClick },
              { label: 'Delete', onClick: handleDelete, danger: true }
            ]}
          />
        </div>
      </div>
      
      {isExpanded && (
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
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(request.name);

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
    vscode.postMessage({ command: 'deleteRequest', collectionId, requestId: request.id });
  };

  const handleRenameClick = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(request.name);
  };

  const submitRename = () => {
    setIsRenaming(false);
    if (renameValue.trim() && renameValue !== request.name) {
       vscode.postMessage({ command: 'renameRequestInline', collectionId, requestId: request.id, name: renameValue.trim() });
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(request.name);
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
      <div className="flex items-center gap-1 overflow-hidden whitespace-nowrap flex-1 pr-2">
        <span className={`text-[9px] font-semibold w-[26px] shrink-0 ${getMethodColor(method)}`}>
          {formatMethod(method)}
        </span>
        {isRenaming ? (
          <input 
            type="text"
            autoFocus
            className="bg-[#1e1e1e] text-white border border-[#454545] px-1 text-[13px] outline-none w-full"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.target.select()}
          />
        ) : (
          <span className="truncate">{request.name}</span>
        )}
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
            { label: 'Rename', onClick: handleRenameClick },
            { label: 'Delete', onClick: handleDelete, danger: true }
          ]}
        />
      </div>
    </div>
  );
}
