import { useState, useEffect } from 'react';
import { vscode } from '../utils/vscode';
import { Plus, ChevronRight, MoreHorizontal, Archive, LayoutTemplate, History, Check, Search, Folder as FolderIcon, Lock } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';

interface DragState {
  draggedRequestId: string | null;
  dragOverInfo: { id: string, position: 'top' | 'bottom' | 'inside' } | null;
  handleDragStart: (id: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (id: string, position: 'top' | 'bottom' | 'inside') => void;
  handleDrop: (targetId: string, position: 'top' | 'bottom' | 'inside') => void;
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
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const handleDragStart = (id: string) => setDraggedRequestId(id);
  const handleDragEnd = () => {
    setDraggedRequestId(null);
    setDragOverInfo(null);
  };
  const handleDragOver = (id: string, position: 'top' | 'bottom' | 'inside') => {
    setDragOverInfo({ id, position });
  };
  const handleDrop = (targetId: string, position: 'top' | 'bottom' | 'inside') => {
    if (draggedRequestId && draggedRequestId !== targetId) {
      vscode.postMessage({ 
        command: 'moveItem', 
        sourceId: draggedRequestId, 
        targetId, 
        position 
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
      } else if (message.command === 'workspacesUpdated') {
        if (message.workspaces !== undefined) {
          setWorkspaces(message.workspaces);
        }
        if (message.activeWorkspaceId !== undefined) {
          setActiveWorkspaceId(message.activeWorkspaceId);
          // Opcional: cuando cambia el workspace, limpiamos la selección actual
          setActiveRequestId(null);
          setActiveEnvironmentId(null);
        }
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

  const filterNodes = (items: any[], query: string): any[] => {
    if (!query) return items;
    return items.map(item => {
      if (item.type === 'request') {
        return item.name.toLowerCase().includes(query.toLowerCase()) ? item : null;
      } else {
        const matchedItems = filterNodes(item.items || [], query);
        const matchesName = item.name.toLowerCase().includes(query.toLowerCase());
        if (matchesName || matchedItems.length > 0) {
          return { ...item, items: !matchesName && matchedItems.length > 0 ? matchedItems : item.items, forceExpand: true };
        }
        return null;
      }
    }).filter(Boolean);
  };

  const filteredCollections = collections.map(c => {
    if (!searchQuery) return c;
    const query = searchQuery.toLowerCase();
    const matchedItems = filterNodes(c.items || [], query);
    const matchesCollection = c.name.toLowerCase().includes(query);
    
    if (matchesCollection || matchedItems.length > 0) {
      return { 
        ...c, 
        items: !matchesCollection && matchedItems.length > 0 ? matchedItems : c.items,
        forceExpand: true
      };
    }
    return null;
  }).filter(Boolean);

  const filteredEnvironments = environments.filter(env => 
    !searchQuery || env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden text-[#cccccc] text-[13px] select-none bg-[var(--vscode-sideBar-background)]">
      <div className="px-3 pt-3 shrink-0 relative z-50">
        <div 
          className={`flex items-center justify-between w-full bg-[#1e1e1e] border ${isWorkspaceDropdownOpen ? 'border-[#454545] rounded-t' : 'border-[#2b2d2e] rounded'} px-3 py-1.5 cursor-pointer hover:bg-[#2a2d2e] transition-colors`}
          onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
        >
          <span className="text-[13px] text-[#cccccc] truncate pr-2">
            {workspaces.find(w => w.id === activeWorkspaceId)?.name || 'Loading Workspace...'}
          </span>
          <ChevronRight size={14} className={`shrink-0 transition-transform text-gray-400 ${isWorkspaceDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
        </div>
        
        {isWorkspaceDropdownOpen && (
          <div className="absolute top-[calc(100%-1px)] left-3 right-3 bg-[#1e1e1e] border border-[#454545] rounded-b shadow-2xl flex flex-col z-50 overflow-hidden">
            <div className="p-2 flex gap-2 items-center">
              <div className="flex-1 flex items-center h-[28px] bg-[#1e1e1e] border border-[#2b2d2e] rounded focus-within:border-[#007fd4] transition-colors px-2">
                <input 
                  type="text" 
                  placeholder="Search Workspaces" 
                  className="bg-transparent text-[#cccccc] text-[12px] outline-none w-full border-none p-0 m-0"
                  autoFocus
                />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWorkspaceDropdownOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-[28px] h-[28px] flex items-center justify-center shrink-0 bg-[#2a2d2e] hover:bg-[#3c3e40] rounded text-[#cccccc] border-none cursor-pointer transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="flex flex-col py-1 border-t border-[#2b2d2e] max-h-[300px] overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#cccccc]">Your Workspaces</div>
              
              {workspaces.length > 0 ? (
                workspaces.map(w => (
                  <div 
                    key={w.id}
                    className={`flex items-center px-3 py-1.5 hover:bg-[#2a2d2e] cursor-pointer group transition-colors ${w.id === activeWorkspaceId ? 'bg-[#37373d]' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      vscode.postMessage({ command: 'setActiveWorkspace', id: w.id });
                      setIsWorkspaceDropdownOpen(false);
                    }}
                  >
                    <div className={`w-7 h-7 flex items-center justify-center shrink-0 rounded-md ${w.id === activeWorkspaceId ? 'bg-[#2a2d2e]' : ''}`}>
                      <Lock size={14} className={w.id === activeWorkspaceId ? "text-[#e0e0e0]" : "text-gray-500 group-hover:text-gray-400 transition-colors"} />
                    </div>
                    <span className={`text-[13px] ml-2 truncate ${w.id === activeWorkspaceId ? 'font-semibold text-[#e0e0e0]' : 'text-[#cccccc]'}`}>
                      {w.name}
                    </span>
                    {w.id === activeWorkspaceId && <Check size={14} className="ml-auto text-gray-400" />}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-[12px] text-gray-400">No workspaces found</div>
              )}
            </div>
          </div>
        )}
      </div>
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
                  className={`flex justify-between items-center py-1.5 px-3 hover:bg-[#2a2d2e] cursor-pointer transition-colors ${!activeEnvironmentId ? 'bg-[#37373d]' : ''}`}
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

      {isCreateModalOpen && (
        <CreateWorkspaceModal 
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(name, type) => {
            vscode.postMessage({ command: 'createWorkspace', name, type });
            setIsCreateModalOpen(false);
          }}
        />
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
      className={`flex justify-between items-center py-1 px-3 hover:bg-[#2a2d2e] group cursor-pointer transition-colors ${activeEnvironmentId === env.id ? 'bg-[#37373d]' : ''}`}
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
    if (collection.forceExpand) return;
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    vscode.postMessage({ command: 'toggleItemExpanded', id: collection.id, expanded: newExpanded });
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
    vscode.postMessage({ command: 'addRequest', parentId: collection.id, name: 'New Request' });
  };
  
  const handleAddFolder = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    vscode.postMessage({ command: 'addFolder', parentId: collection.id, name: 'New Folder' });
  };

  return (
    <div className="flex flex-col">
      <div 
        className={`flex justify-between items-center py-1 px-3 hover:bg-[#2a2d2e] group cursor-pointer transition-colors ${dragState.dragOverInfo?.id === collection.id && dragState.dragOverInfo?.position === 'inside' ? 'bg-[#2a2d2e] ring-1 ring-orange-500' : ''}`}
        onClick={toggleExpanded}
        onDragOver={(e) => { e.preventDefault(); dragState.handleDragOver(collection.id, 'inside'); }}
        onDrop={(e) => { e.preventDefault(); dragState.handleDrop(collection.id, 'inside'); }}
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
              { label: 'Add request', onClick: handleAddRequest },
              { label: 'Add folder', onClick: handleAddFolder },
              { label: 'Rename', onClick: handleRenameClick },
              { label: 'Delete', onClick: handleDelete, danger: true }
            ]}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="flex flex-col relative">
          <div className="absolute left-[20px] top-0 bottom-0 w-[1px] bg-[#3a3d3e] z-10 pointer-events-none"></div>
          {collection.items && collection.items.length > 0 ? (
            collection.items.map((item: any) => (
               <SidebarItemNode key={item.id} item={item} depth={1} activeRequestId={activeRequestId} dragState={dragState} />
            ))
          ) : (
             <div 
              className={`flex flex-col py-2 pl-[36px] pr-3 text-gray-400`}
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

function SidebarItemNode({ item, depth, activeRequestId, dragState }: { item: any, depth: number, activeRequestId?: string | null, dragState: DragState }) {
    if (item.type === 'folder') {
        return <FolderItem folder={item} depth={depth} activeRequestId={activeRequestId} dragState={dragState} />;
    } else {
        return <RequestItem request={item} depth={depth} activeRequestId={activeRequestId} dragState={dragState} />;
    }
}

function FolderItem({ folder, depth, activeRequestId, dragState }: { folder: any, depth: number, activeRequestId?: string | null, dragState: DragState }) {
  const [expanded, setExpanded] = useState(folder.expanded ?? false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);

  const isExpanded = folder.forceExpand ? true : expanded;

  const toggleExpanded = () => {
    if (folder.forceExpand) return;
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    vscode.postMessage({ command: 'toggleItemExpanded', id: folder.id, expanded: newExpanded });
  };

  const handleDelete = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    vscode.postMessage({ command: 'deleteItem', id: folder.id });
  };

  const handleRenameClick = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(folder.name);
  };

  const submitRename = () => {
    setIsRenaming(false);
    if (renameValue.trim() && renameValue !== folder.name) {
       vscode.postMessage({ command: 'renameItemInline', id: folder.id, name: renameValue.trim() });
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(folder.name);
  };

  const handleAddRequest = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    vscode.postMessage({ command: 'addRequest', parentId: folder.id, name: 'New Request' });
  };
  
  const handleAddFolder = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    vscode.postMessage({ command: 'addFolder', parentId: folder.id, name: 'New Folder' });
  };

  const paddingLeft = 16 + depth * 16;
  const isDragOverTop = dragState.dragOverInfo?.id === folder.id && dragState.dragOverInfo?.position === 'top';
  const isDragOverBottom = dragState.dragOverInfo?.id === folder.id && dragState.dragOverInfo?.position === 'bottom';
  const isDragOverInside = dragState.dragOverInfo?.id === folder.id && dragState.dragOverInfo?.position === 'inside';

  return (
    <div className="flex flex-col relative">
      <div 
        draggable
        onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            dragState.handleDragStart(folder.id);
        }}
        onDragEnd={() => dragState.handleDragEnd()}
        onDragOver={(e) => {
            e.preventDefault();
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            let position: 'top' | 'bottom' | 'inside' = 'inside';
            if (y < rect.height * 0.25) position = 'top';
            else if (y > rect.height * 0.75) position = 'bottom';
            dragState.handleDragOver(folder.id, position);
        }}
        onDrop={(e) => {
            e.preventDefault();
            if (dragState.dragOverInfo) {
                dragState.handleDrop(folder.id, dragState.dragOverInfo.position);
            }
        }}
        className={`flex justify-between items-center py-1 pr-3 group cursor-pointer transition-colors relative z-0 w-full ${isDragOverInside ? 'bg-[#2a2d2e] ring-1 ring-orange-500' : 'hover:bg-[#2a2d2e]'} ${dragState.draggedRequestId === folder.id ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={toggleExpanded}
      >
        {isDragOverTop && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500 z-10 pointer-events-none" />
        )}
        {isDragOverBottom && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 z-10 pointer-events-none" />
        )}
        <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap flex-1 pr-2">
          <ChevronRight size={14} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${folder.forceExpand ? 'opacity-50' : ''}`} />
          <FolderIcon size={13} className="text-gray-400 shrink-0" />
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
            <span className="truncate">{folder.name}</span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
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
              { label: 'Add request', onClick: handleAddRequest },
              { label: 'Add folder', onClick: handleAddFolder },
              { label: 'Rename', onClick: handleRenameClick },
              { label: 'Delete', onClick: handleDelete, danger: true }
            ]}
          />
        </div>
      </div>
      
      {isExpanded && (
        <div className="flex flex-col relative">
          <div className="absolute top-0 bottom-0 w-[1px] bg-[#3a3d3e] z-10 pointer-events-none" style={{ left: `${paddingLeft + 6}px` }}></div>
          {folder.items && folder.items.length > 0 ? (
            folder.items.map((item: any) => (
               <SidebarItemNode key={item.id} item={item} depth={depth + 1} activeRequestId={activeRequestId} dragState={dragState} />
            ))
          ) : (
             <div className="py-1 text-gray-500 text-[12px] italic" style={{ paddingLeft: `${paddingLeft + 24}px` }}>
                 Empty folder
             </div>
          )}
        </div>
      )}
    </div>
  );
}

function RequestItem({ request, depth, activeRequestId, dragState }: { request: any, depth: number, activeRequestId?: string | null, dragState: DragState }) {
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
      id: request.id 
    });
  };

  const handleDelete = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    vscode.postMessage({ command: 'deleteItem', id: request.id });
  };

  const handleRenameClick = (e: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    setIsRenaming(true);
    setRenameValue(request.name);
  };

  const submitRename = () => {
    setIsRenaming(false);
    if (renameValue.trim() && renameValue !== request.name) {
       vscode.postMessage({ command: 'renameItemInline', id: request.id, name: renameValue.trim() });
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue(request.name);
  };

  const method = request.requestData?.method || 'GET';
  const paddingLeft = 16 + depth * 16;
  const isDragOverTop = dragState.dragOverInfo?.id === request.id && dragState.dragOverInfo?.position === 'top';
  const isDragOverBottom = dragState.dragOverInfo?.id === request.id && dragState.dragOverInfo?.position === 'bottom';

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
              dragState.handleDrop(request.id, dragState.dragOverInfo.position);
          }
      }}
      className={`flex justify-between items-center py-1 pr-3 group cursor-pointer transition-colors relative z-0 w-full ${isActive ? 'bg-[#37373d]' : 'hover:bg-[#2a2d2e]'} ${dragState.draggedRequestId === request.id ? 'opacity-50' : ''}`}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={handleOpen}
    >
      {isDragOverTop && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500 z-10 pointer-events-none" />
      )}
      {isDragOverBottom && (
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
