import { useState } from "react";
import { vscode } from "../utils/vscode";
import { GripVertical, Trash2 } from 'lucide-react';

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface EnvironmentPanelProps {
  environmentName: string;
  initialVariables?: EnvironmentVariable[];
}

export function EnvironmentPanel({ environmentName, initialVariables = [] }: EnvironmentPanelProps) {
  const [variables, setVariables] = useState<EnvironmentVariable[]>(
    initialVariables.length > 0 ? initialVariables : [{ id: crypto.randomUUID(), key: '', value: '', enabled: true }]
  );

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ index: number, position: 'top' | 'bottom' } | null>(null);

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

  const handleSave = () => {
    vscode.postMessage({
      command: 'saveEnvironment',
      data: {
        name: environmentName,
        variables: variables.filter(v => v.key.trim() !== '')
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-vsc-editor-bg text-vsc-foreground p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[15px] font-bold text-[#cccccc]">{environmentName}</h2>
        <button 
          onClick={handleSave}
          className="bg-[#0cbb52] hover:bg-[#0aa647] text-white px-4 py-1.5 rounded text-[13px] cursor-pointer outline-none border-none transition-colors"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-auto min-h-0">
        <div className="flex flex-col border-l border-r border-t border-vsc-panel-border bg-vsc-editor-bg">
          <div className="grid grid-cols-[44px_1fr_1fr_40px] border-b border-vsc-panel-border bg-vsc-editor-bg font-semibold text-[12px] h-[34px]">
            <div className="border-r border-vsc-panel-border flex items-center justify-center"></div>
            <div className="px-2 border-r border-vsc-panel-border flex items-center">Variable</div>
            <div className="px-2 border-r border-vsc-panel-border flex items-center">Value</div>
            <div className="px-2"></div>
          </div>
          
          <div className="flex-grow flex flex-col">
            {variables.map((v, index) => {
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
                  className={`relative h-[34px] grid grid-cols-[44px_1fr_1fr_40px] border-b border-vsc-panel-border group transition-colors
                    ${isLastEmptyRow ? '' : 'hover:bg-[#222222]'}
                    ${isDragged ? 'opacity-50 bg-[#2a2d2e]' : ''}
                  `}
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
                  <div className="border-r border-vsc-panel-border py-[5px] px-[3px]">
                    <input 
                      type="text" 
                      value={v.key}
                      onChange={(e) => updateVariable(v.id, 'key', e.target.value)}
                      placeholder="Add variable"
                      className="w-full h-full px-2 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors"
                    />
                  </div>

                  {/* Value Column */}
                  <div className="border-r border-vsc-panel-border py-[5px] px-[3px]">
                    <input 
                      type="text" 
                      value={v.value}
                      onChange={(e) => updateVariable(v.id, 'value', e.target.value)}
                      placeholder=""
                      className="w-full h-full px-2 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors"
                    />
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
