interface BodyPanelProps {
  body: string;
  setBody: (body: string) => void;
}

export function BodyPanel({ body, setBody }: BodyPanelProps) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 text-sm">Body (JSON, Text, etc.)</label>
      <textarea 
        value={body}
        onChange={e => setBody(e.target.value)}
        className="bg-transparent text-vsc-input-foreground border border-vsc-panel-border p-2 rounded focus:outline focus:outline-1 focus:outline-vsc-focus focus:border-vsc-focus box-border w-full min-h-[100px] resize-y font-mono" 
        placeholder='{"key": "value"}'
      />
    </div>
  );
}
