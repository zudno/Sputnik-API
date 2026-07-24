import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { HeaderItem } from '../types';

interface HeadersPanelProps {
  headers: HeaderItem[];
  setHeaders: (headers: HeaderItem[]) => void;
}

export function HeadersPanel({ headers, setHeaders }: HeadersPanelProps) {
  const [isBulkEdit, setIsBulkEdit] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync bulkText when entering bulk mode
  useEffect(() => {
    if (isBulkEdit) {
      const text = headers
        .filter(h => h.key.trim() !== '' || h.value.trim() !== '')
        .map(h => {
          const separator = h.key.trim() && h.value.trim() ? ': ' : '';
          return `${h.key.trim()}${separator}${h.value.trim()}`;
        })
        .join('\n');
      setBulkText(text);
    }
  }, [isBulkEdit]);

  // Parse bulk text back to grid
  const handleBulkChange = (value: string | undefined) => {
    const text = value || '';
    setBulkText(text);
    
    const lines = text.split('\n');
    const newHeaders: HeaderItem[] = lines.map((line) => {
      const sepIdx = line.indexOf(':');
      let key = line;
      let val = '';
      
      if (sepIdx !== -1) {
        key = line.substring(0, sepIdx).trim();
        val = line.substring(sepIdx + 1).trim();
      } else {
        key = line.trim();
      }
      
      const existing = headers.find(h => h.key === key && key !== '');
      
      return {
        id: existing?.id || crypto.randomUUID(),
        key,
        value: val,
        description: existing?.description || '',
        enabled: existing !== undefined ? existing.enabled : true
      };
    });

    if (newHeaders.length === 0 || newHeaders[newHeaders.length - 1].key !== '' || newHeaders[newHeaders.length - 1].value !== '') {
      newHeaders.push({ id: crypto.randomUUID(), key: '', value: '', description: '', enabled: true });
    }
    
    setHeaders(newHeaders);
  };

  const updateHeader = (id: string, field: keyof HeaderItem, value: any) => {
    const newHeaders = headers.map(h => {
      if (h.id === id) {
        return { ...h, [field]: value };
      }
      return h;
    });
    
    const lastRow = newHeaders[newHeaders.length - 1];
    if (lastRow.key !== '' || lastRow.value !== '' || lastRow.description !== '') {
      newHeaders.push({
        id: crypto.randomUUID(),
        key: '',
        value: '',
        description: '',
        enabled: true
      });
    }
    
    setHeaders(newHeaders);
  };

  const deleteHeader = (id: string) => {
    const newHeaders = headers.filter(h => h.id !== id);
    if (newHeaders.length === 0) {
      newHeaders.push({ id: crypto.randomUUID(), key: '', value: '', description: '', enabled: true });
    }
    setHeaders(newHeaders);
  };

  return (
    <div className="flex flex-col h-full text-[13px] text-vsc-foreground">
      <div className="flex justify-between items-center mb-2">
        <span className="text-vsc-descriptionForeground">Headers</span>
        <button 
          onClick={() => setIsBulkEdit(!isBulkEdit)}
          className="text-blue-500 hover:text-blue-400 bg-transparent border-none cursor-pointer outline-none text-[13px]"
        >
          {isBulkEdit ? 'Key-Value Edit' : 'Bulk Edit'}
        </button>
      </div>

      <div className="flex-grow border border-vsc-panel-border overflow-hidden flex flex-col min-h-0">
        {isBulkEdit ? (
          <Editor
            height="100%"
            language="plaintext"
            theme="vs-dark"
            value={bulkText}
            onChange={handleBulkChange}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              folding: false,
              wordWrap: 'on',
              fontSize: 13,
              scrollBeyondLastLine: false,
            }}
          />
        ) : (
          <div className="flex flex-col h-full overflow-auto bg-vsc-editor-bg">
            <div className="grid grid-cols-[44px_1fr_1fr_1fr_40px] border-b border-vsc-panel-border bg-vsc-editor-bg font-semibold sticky top-0 z-10 text-[12px] h-[34px]">
              <div className="border-r border-vsc-panel-border flex items-center justify-center"></div>
              <div className="px-2 border-r border-vsc-panel-border flex items-center">Key</div>
              <div className="px-2 border-r border-vsc-panel-border flex items-center">Value</div>
              <div className="px-2 border-r border-vsc-panel-border flex items-center">Description</div>
              <div className="px-2"></div>
            </div>
            
            <div className="flex-grow flex flex-col">
              {headers.map((header, index) => {
                const isLastEmptyRow = index === headers.length - 1 && !header.key && !header.value && !header.description;
                const isDragOver = dragOverIndex === index;
                const isDragged = draggedIndex === index;
                
                return (
                  <div 
                    key={header.id} 
                    draggable={!isLastEmptyRow}
                    onDragStart={(e) => {
                      setDraggedIndex(index);
                      // Set data payload (required by firefox)
                      e.dataTransfer.setData('text/plain', index.toString());
                      e.dataTransfer.effectAllowed = 'move';
                      
                      // Optional: create a nice drag ghost image or let browser do it
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!isLastEmptyRow && draggedIndex !== null && draggedIndex !== index) {
                        setDragOverIndex(index);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverIndex === index) {
                        setDragOverIndex(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedIndex === null || draggedIndex === index || isLastEmptyRow) {
                        setDragOverIndex(null);
                        return;
                      }
                      
                      const newHeaders = [...headers];
                      const draggedItem = newHeaders[draggedIndex];
                      
                      newHeaders.splice(draggedIndex, 1);
                      newHeaders.splice(index, 0, draggedItem);
                      
                      setHeaders(newHeaders);
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`relative h-[34px] grid grid-cols-[44px_1fr_1fr_1fr_40px] border-b border-vsc-panel-border group transition-colors
                      ${isLastEmptyRow ? '' : 'hover:bg-[#222222]'}
                      ${isDragged ? 'opacity-50 bg-[#2a2d2e]' : ''}
                    `}
                    style={{
                      // If it's drag over, we remove top border to replace with the orange one 
                      // but tailwind class handles the color. We just adjust negative margin or similar if needed.
                      // The border-t-2 handles it cleanly.
                    }}
                  >
                    {isDragOver && (
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#ff6c37] pointer-events-none z-10" />
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
                            checked={header.enabled}
                            onChange={(e) => updateHeader(header.id, 'enabled', e.target.checked)}
                            className="appearance-none w-3.5 h-3.5 rounded-sm border border-[#888888] checked:bg-white checked:border-white bg-transparent outline-none cursor-pointer flex items-center justify-center after:content-[''] checked:after:block after:hidden after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-[#1e1e1e] after:rotate-45 after:-mt-[2px] shrink-0"
                          />
                        </>
                      )}
                    </div>

                    {/* Key Column */}
                    <div className="border-r border-vsc-panel-border py-[5px] px-[3px]">
                      <input 
                        type="text" 
                        value={header.key}
                        onChange={(e) => updateHeader(header.id, 'key', e.target.value)}
                        placeholder="Key"
                        className="w-full h-full px-2 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors"
                      />
                    </div>

                    {/* Value Column */}
                    <div className="border-r border-vsc-panel-border py-[5px] px-[3px]">
                      <input 
                        type="text" 
                        value={header.value}
                        onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-full h-full px-2 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors"
                      />
                    </div>

                    {/* Description Column */}
                    <div className="border-r border-vsc-panel-border py-[5px] px-[3px]">
                      <input 
                        type="text" 
                        value={header.description}
                        onChange={(e) => updateHeader(header.id, 'description', e.target.value)}
                        placeholder="Description"
                        className="w-full h-full px-2 bg-transparent border border-transparent focus:border-[#444444] focus:bg-[#1e1e1e] rounded-none outline-none text-vsc-foreground placeholder-[#666666] font-sans text-[13px] transition-colors"
                      />
                    </div>

                    {/* Actions Column */}
                    <div className="p-2 flex items-center justify-center">
                      {!isLastEmptyRow && (
                        <button 
                          onClick={() => deleteHeader(header.id)}
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
        )}
      </div>
    </div>
  );
}
