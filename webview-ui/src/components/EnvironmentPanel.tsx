import { useState } from "react";
import { vscode } from "../utils/vscode";

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">{environmentName}</h1>
        <button 
          onClick={handleSave}
          className="bg-[#0cbb52] hover:bg-[#0aa647] text-white px-4 py-1.5 rounded text-[13px] cursor-pointer outline-none border-none transition-colors"
        >
          Save
        </button>
      </div>

      <div className="flex-1 overflow-auto border border-vsc-panel-border rounded">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-vsc-panel-border bg-[#2a2d2e]">
              <th className="w-10 px-2 py-2 text-center"></th>
              <th className="px-3 py-2 font-medium border-x border-vsc-panel-border">Variable</th>
              <th className="px-3 py-2 font-medium border-x border-vsc-panel-border">Value</th>
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <tr key={v.id} className="border-b border-vsc-panel-border hover:bg-[#2a2d2e] transition-colors group">
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={v.enabled}
                    onChange={(e) => updateVariable(v.id, 'enabled', e.target.checked)}
                    className="cursor-pointer accent-[#0cbb52]"
                  />
                </td>
                <td className="px-0 py-0 border-x border-vsc-panel-border">
                  <input
                    type="text"
                    value={v.key}
                    onChange={(e) => updateVariable(v.id, 'key', e.target.value)}
                    placeholder="Add variable"
                    className="w-full h-full px-3 py-2 bg-transparent border-none outline-none text-vsc-foreground focus:bg-[#3c3e40]"
                  />
                </td>
                <td className="px-0 py-0 border-x border-vsc-panel-border">
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => updateVariable(v.id, 'value', e.target.value)}
                    placeholder=""
                    className="w-full h-full px-3 py-2 bg-transparent border-none outline-none text-vsc-foreground focus:bg-[#3c3e40]"
                  />
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    onClick={() => removeVariable(v.id)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer outline-none"
                    title="Remove"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
