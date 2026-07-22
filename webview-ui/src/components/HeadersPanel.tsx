interface HeadersPanelProps {
  headers: string;
  setHeaders: (headers: string) => void;
}

export function HeadersPanel({ headers, setHeaders }: HeadersPanelProps) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm">Headers (uno por línea, formato Clave: Valor)</label>
      <textarea 
        value={headers}
        onChange={e => setHeaders(e.target.value)}
        className="bg-transparent text-vsc-input-foreground border border-vsc-panel-border p-2 rounded focus:outline focus:outline-1 focus:outline-vsc-focus focus:border-vsc-focus box-border w-full min-h-[100px] resize-y font-mono" 
        placeholder="Content-Type: application/json"
      />
    </div>
  );
}
