import { useState, useEffect } from "react";
import { vscode } from "../utils/vscode";
import { GripVertical, Trash2, Search, Save, Key, Eye, EyeOff } from 'lucide-react';

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  isSensitive?: boolean;
}

interface EnvironmentPanelProps {
  environmentId?: string;
  environmentName: string;
  initialVariables?: EnvironmentVariable[];
}

export function EnvironmentPanel({ environmentId = 'Globals', environmentName, initialVariables = [] }: EnvironmentPanelProps) {
  const [variables, setVariables] = useState<EnvironmentVariable[]>(() => {
    const vars = initialVariables.length > 0 ? [...initialVariables] : [];
    if (vars.length === 0 || vars[vars.length - 1].key !== '' || vars[vars.length - 1].value !== '') {
      vars.push({ id: crypto.randomUUID(), key: '', value: '', enabled: true });
    }
    return vars;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ index: number, position: 'top' | 'bottom' } | null>(null);

  const [name, setName] = useState(environmentName);
  const [filterText, setFilterText] = useState("");
  const [keyColWidth, setKeyColWidth] = useState(220); // Default wider value column
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setName(environmentName);
  }, [environmentName]);

  useEffect(() => {
    if (initialVariables && initialVariables.length > 0) {
      const vars = [...initialVariables];
      if (vars[vars.length - 1].key !== '' || vars[vars.length - 1].value !== '') {
        vars.push({ id: crypto.randomUUID(), key: '', value: '', enabled: true });
      }
      setVariables(vars);
    } else {
      setVariables([{ id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
    }
  }, [initialVariables]);

  const updateVariable = (id: string, field: keyof EnvironmentVariable, value: string | boolean) => {
    const newVars = variables.map(v => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    });

    const lastVar = newVars[newVars.length - 1];
    if (lastVar.key !== '' || lastVar.value !== '') {
      newVars.push({ id: crypto.randomUUID(), key: '', value: '', enabled: true });
    }

    setVariables(newVars);
  };

  const removeVariable = (id: string) => {
    if (variables.length === 1) {
      setVariables([{ id: crypto.randomUUID(), key: '', value: '', enabled: true }]);
      return;
    }
    setVariables(variables.filter(v => v.id !== id));
  };

  const handleRename = () => {
    let finalName = name.trim();
    if (!finalName) {
      finalName = 'New Environment';
      setName(finalName);
    }
    
    if (environmentId !== 'Globals' && finalName !== environmentName) {
      vscode.postMessage({
        command: 'renameEnvironmentFromPanel',
        id: environmentId,
        name: finalName
      });
    }
  };

  const handleSave = () => {
    vscode.postMessage({
      command: 'saveEnvironment',
      data: {
        id: environmentId,
        name: name,
        variables: variables.filter(v => v.key.trim() !== '')
      }
    });
  };

  const handleMouseDownOnResizer = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = keyColWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setKeyColWidth(Math.max(100, startWidth + delta));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="flex flex-col h-full bg-vsc-editor-bg text-vsc-foreground px-4 pt-3 pb-1">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center text-[13px] h-[28px]">
          {environmentId === 'Globals' ? (
             <div className="inline-grid items-center">
               <span className="px-1.5 py-0.5 font-semibold text-white">Globals</span>
             </div>
          ) : (
            <div className="inline-grid items-center">
              <span className="invisible whitespace-pre px-1.5 py-0.5 font-semibold col-start-1 row-start-1 pointer-events-none min-w-[1ch] border-2 border-transparent">
                {name || ''}
              </span>
              <input 
                value={name || ''} 
                size={1}
                onChange={e => setName(e.target.value)}
                onBlur={handleRename}
                onFocus={e => e.target.select()}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                className="bg-transparent border-2 border-transparent focus:border-[#007fd4] focus:bg-transparent text-white outline-none cursor-text hover:bg-[#2a2d2e] px-1.5 py-0.5 rounded font-semibold w-full min-w-0 col-start-1 row-start-1 m-0 leading-tight transition-colors" 
              />
            </div>
          )}
        </div>
        
        <button 
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-transparent hover:bg-[#2a2d2e] text-[#cccccc] hover:text-white px-2.5 py-1.5 rounded text-[13px] cursor-pointer outline-none border-none transition-colors"
        >
          <Save size={16} />
          <span>Save</span>
        </button>
      </div>

      <hr className="border-0 border-t border-vsc-panel-border -mx-4 mb-4" />
      
      {environmentId === 'Globals' ? (
        <p className="text-[13px] text-[#cccccc] mb-4 leading-relaxed">
          Global variables for a workspace are a set of variables that are always available within the scope of that workspace. They can be viewed and edited by anyone in that workspace.
        </p>
      ) : (
        <p className="text-[13px] text-[#cccccc] mb-4 leading-relaxed">
          Environment variables are tied to this specific environment. They override global variables with the same name.
        </p>
      )}

      <div className="mb-4 relative w-fit">
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
          <Search size={14} className="text-[#888888]" />
        </div>
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter variables"
          className="pl-8 pr-3 py-1.5 bg-transparent border border-vsc-panel-border rounded text-[13px] text-vsc-foreground focus:border-[#007fd4] outline-none w-[300px]"
        />
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <div className="flex flex-col border-l border-r border-t border-vsc-panel-border bg-vsc-editor-bg">
          <div 
            className="grid border-b border-vsc-panel-border bg-[#222222] font-semibold text-[12px] h-[34px]"
            style={{ gridTemplateColumns: `44px ${keyColWidth}px 1fr 40px` }}
          >
            <div className="border-r border-vsc-panel-border flex items-center justify-center"></div>
            <div className="border-r border-vsc-panel-border flex items-center relative group">
              <span className="px-2">Variable</span>
              <div 
                className="absolute right-[-3px] top-0 bottom-0 w-[6px] cursor-col-resize hover:bg-[#007fd4] z-10 transition-colors"
                onMouseDown={handleMouseDownOnResizer}
              />
            </div>
            <div className="px-2 border-r border-vsc-panel-border flex items-center">Value</div>
            <div className="px-2"></div>
          </div>
          
          <div className="flex-grow flex flex-col">
            {variables.map((v, i) => ({ v, index: i })).filter(({ v, index }) => {
              const isLastEmptyRow = index === variables.length - 1 && !v.key && !v.value;
              if (isLastEmptyRow) return true;
              if (!filterText) return true;
              return v.key.toLowerCase().includes(filterText.toLowerCase()) || v.value.toLowerCase().includes(filterText.toLowerCase());
            }).map(({ v, index }) => {
              const isLastEmptyRow = index === variables.length - 1 && !v.key && !v.value;
              const isDragged = draggedIndex === index;
              
              return (
                <div 
                  key={v.id} 
                  draggable={!isLastEmptyRow}
                  onDragStart={(e) => {
                    setDraggedIndex(index);
                    e.dataTransfer.setData('text/plain', index.toString());
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!isLastEmptyRow && draggedIndex !== null && draggedIndex !== index) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const position = y < rect.height / 2 ? 'top' : 'bottom';
                      if (dragOverInfo?.index !== index || dragOverInfo?.position !== position) {
                        setDragOverInfo({ index, position });
                      }
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverInfo?.index === index) {
                      setDragOverInfo(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedIndex === null || draggedIndex === index || isLastEmptyRow || !dragOverInfo) {
                      setDragOverInfo(null);
                      return;
                    }
                    
                    const newVars = [...variables];
                    const draggedItem = newVars[draggedIndex];
                    
                    newVars.splice(draggedIndex, 1);
                    
                    let insertIndex = index;
                    if (draggedIndex < index) {
                        insertIndex = dragOverInfo.position === 'top' ? index - 1 : index;
                    } else {
                        insertIndex = dragOverInfo.position === 'top' ? index : index + 1;
                    }
                    
                    newVars.splice(insertIndex, 0, draggedItem);
                    
                    setVariables(newVars);
                    setDraggedIndex(null);
                    setDragOverInfo(null);
                  }}
                  onDragEnd={() => {
                    setDraggedIndex(null);
                    setDragOverInfo(null);
                  }}
                  className={`relative h-[34px] grid border-b border-vsc-panel-border group transition-colors
                    ${isLastEmptyRow ? '' : 'hover:bg-[#222222]'}
                    ${isDragged ? 'opacity-50 bg-[#2a2d2e]' : ''}
                  `}
                  style={{ gridTemplateColumns: `44px ${keyColWidth}px 1fr 40px` }}
                >
                  {dragOverInfo?.index === index && dragOverInfo?.position === 'top' && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ff6c37] pointer-events-none z-10" />
                  )}
                  {dragOverInfo?.index === index && dragOverInfo?.position === 'bottom' && (
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#ff6c37] pointer-events-none z-10" />
                  )}
                  
                  {/* Handle & Checkbox Column */}
                  <div className="p-1 border-r border-vsc-panel-border flex items-center justify-center gap-1.5">
                    {!isLastEmptyRow && (
                      <>
                        <div className="cursor-grab active:cursor-grabbing flex items-center justify-center">
                          <GripVertical size={14} className="opacity-0 group-hover:opacity-100 text-[#888888]" />
                        </div>
                        <input 
                          type="checkbox"
                          checked={v.enabled}
                          onChange={(e) => updateVariable(v.id, 'enabled', e.target.checked)}
                          className="appearance-none w-3.5 h-3.5 rounded-sm border border-[#888888] checked:bg-white checked:border-white bg-transparent outline-none cursor-pointer flex items-center justify-center after:content-[''] checked:after:block after:hidden after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-[#1e1e1e] after:rotate-45 after:-mt-[2px] shrink-0"
                        />
                      </>
                    )}
                  </div>

                  {/* Key Column */}
                  <div className="border-r border-vsc-panel-border py-[5px] px-[3px] relative flex">
                    <input 
                      type="text" 
                      value={v.key}
                      onChange={(e) => updateVariable(v.id, 'key', e.target.value)}
                      placeholder="Add variable"
                      className="w-full h-full px-2 pr-6 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors"
                    />
                    {!isLastEmptyRow && (
                      <button
                        onClick={() => updateVariable(v.id, 'isSensitive', !v.isSensitive)}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center rounded hover:bg-[#333333] transition-colors ${v.isSensitive ? 'bg-[#2a2d2e] text-[#cccccc]' : 'text-[#666666] opacity-0 group-hover:opacity-100'}`}
                        title={v.isSensitive ? "Remove sensitive mark" : "Mark as sensitive"}
                      >
                        <Key size={14} />
                      </button>
                    )}
                  </div>

                  {/* Value Column */}
                  <div className="border-r border-vsc-panel-border py-[5px] px-[3px] relative flex">
                    <input 
                      type={v.isSensitive && !revealedIds[v.id] ? "password" : "text"}
                      value={v.value}
                      onChange={(e) => updateVariable(v.id, 'value', e.target.value)}
                      placeholder=""
                      className={`w-full h-full px-2 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors ${v.isSensitive && !revealedIds[v.id] ? 'font-mono' : ''} ${v.isSensitive ? 'pr-8' : ''}`}
                    />
                    {!isLastEmptyRow && v.isSensitive && (
                      <button
                        onClick={() => setRevealedIds(prev => ({ ...prev, [v.id]: !prev[v.id] }))}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-1 flex items-center justify-center rounded bg-[#2a2d2e] hover:bg-[#333333] transition-colors text-[#cccccc]"
                        title={revealedIds[v.id] ? "Hide value" : "Show value"}
                      >
                        {revealedIds[v.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="p-2 flex items-center justify-center">
                    {!isLastEmptyRow && (
                      <button 
                        onClick={() => removeVariable(v.id)}
                        className="opacity-0 group-hover:opacity-100 text-[#888888] hover:text-[#cccccc] bg-transparent border-none outline-none cursor-pointer transition-opacity"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
