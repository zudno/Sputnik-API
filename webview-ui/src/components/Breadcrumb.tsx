import { vscode } from "../utils/vscode";

interface BreadcrumbProps {
  requestMeta: {
    name?: string;
    collectionName?: string;
    collectionId?: string;
    requestId?: string;
  };
  setRequestMeta: React.Dispatch<React.SetStateAction<{
    name?: string;
    collectionName?: string;
    collectionId?: string;
    requestId?: string;
  }>>;
}

export function Breadcrumb({ requestMeta, setRequestMeta }: BreadcrumbProps) {
  const handleRenameRequest = () => {
    if (requestMeta.collectionId && requestMeta.requestId && requestMeta.name) {
      vscode.postMessage({
        command: 'renameRequestFromPanel',
        collectionId: requestMeta.collectionId,
        requestId: requestMeta.requestId,
        name: requestMeta.name
      });
    }
  };

  return (
    <div className="flex items-center text-[13px] h-[28px]">
      {requestMeta.collectionName ? (
        <>
          <span className="text-blue-400 font-semibold mr-2">HTTP</span>
          <button className="text-neutral-500 font-normal hover:bg-[#2a2d2e] hover:text-gray-200 px-1.5 py-0.5 rounded cursor-pointer transition-colors outline-none">
            {requestMeta.collectionName}
          </button>
          <span className="text-neutral-500 font-normal mx-1">/</span>
          <div className="inline-grid items-center">
            <span className="invisible whitespace-pre px-1.5 py-0.5 font-semibold col-start-1 row-start-1 pointer-events-none min-w-[20px] border-2 border-transparent">
              {requestMeta.name || ''}
            </span>
            <input 
              value={requestMeta.name || ''} 
              size={1}
              onChange={e => setRequestMeta({...requestMeta, name: e.target.value})}
              onBlur={handleRenameRequest}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="bg-transparent border-2 border-transparent focus:border-[#007fd4] text-white outline-none cursor-text hover:bg-[#2a2d2e] px-1.5 py-0.5 rounded transition-all font-semibold w-full min-w-0 col-start-1 row-start-1 m-0 leading-tight" 
            />
          </div>
        </>
      ) : (
        <h2 className="text-xl font-bold m-0 p-0 leading-none">Sputnik API</h2>
      )}
    </div>
  );
}
