import { useState } from 'react';
import { Lock, Check } from 'lucide-react';

interface CreateWorkspaceModalProps {
  onClose: () => void;
  onCreate: (name: string, type: string) => void;
}

export function CreateWorkspaceModal({ onClose, onCreate }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');

  return (
    <div className="absolute inset-0 bg-[var(--vscode-sideBar-background)] z-[100] flex flex-col p-6 overflow-y-auto">
      <h1 className="text-xl font-bold text-white mb-6">Create your workspace</h1>
      
      <div className="flex flex-col gap-1.5 mb-6">
        <label className="text-[13px] text-gray-300">Workspace name</label>
        <input 
          type="text" 
          placeholder="A team name, project or service..." 
          className="bg-transparent border border-[#3c3e40] rounded px-3 py-2 text-[13px] text-white focus:border-[#007fd4] outline-none transition-colors"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-1.5 mb-8">
        <label className="text-[13px] text-gray-300">Select workspace type</label>
        <div className="flex flex-col gap-3">
          {/* Internal Option */}
          <div className="flex flex-col p-3 border border-[#007fd4] rounded bg-[#2a2d2e] cursor-pointer">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-white" />
                <span className="text-[13px] font-semibold text-white">Internal</span>
              </div>
              <div className="w-[16px] h-[16px] rounded-full bg-[#007fd4] flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            </div>
            <span className="text-[12px] text-gray-400">Share APIs with your team.</span>
          </div>
        </div>
      </div>
      
      <div className="mt-auto flex justify-end gap-3 pt-4">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-[13px] font-semibold text-[#cccccc] bg-[#3c3e40] hover:bg-[#4a4d4f] rounded cursor-pointer border-none transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={() => {
            if (name.trim()) onCreate(name, 'Internal');
          }}
          disabled={!name.trim()}
          className={`px-4 py-2 text-[13px] font-semibold rounded cursor-pointer border-none transition-colors ${
            name.trim() 
              ? 'bg-[#007fd4] hover:bg-[#0069b0] text-white' 
              : 'bg-[#007fd4]/50 text-white/50 cursor-not-allowed'
          }`}
        >
          Create Workspace
        </button>
      </div>
    </div>
  );
}
