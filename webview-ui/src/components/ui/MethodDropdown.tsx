import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface MethodDropdownProps {
  method: string;
  setMethod: (method: string) => void;
}

const METHODS = [
  { name: 'GET', color: 'text-[#61c275]' },
  { name: 'POST', color: 'text-[#f3ce63]' },
  { name: 'PUT', color: 'text-[#5297eb]' },
  { name: 'PATCH', color: 'text-[#c197e0]' },
  { name: 'DELETE', color: 'text-[#e3716b]' },
  { name: 'HEAD', color: 'text-[#61c275]' },
  { name: 'OPTIONS', color: 'text-[#e673ab]' },
];

export function MethodDropdown({ method, setMethod }: MethodDropdownProps) {
  const [open, setOpen] = useState(false);
  const [customMethod, setCustomMethod] = useState('');

  const getMethodColor = (m: string) => {
    const found = METHODS.find(x => x.name === m.toUpperCase());
    return found ? found.color : 'text-[#cccccc]';
  };

  const handleCustomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customMethod.trim()) {
      setMethod(customMethod.trim().toUpperCase());
      setOpen(false);
    }
  };

  return (
    <RadixDropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <RadixDropdownMenu.Trigger asChild>
        <button 
          className={`flex items-center justify-between w-28 bg-transparent font-bold cursor-pointer outline-none border-none pl-3 pr-3 py-2.5 h-full focus-visible:ring-1 focus-visible:ring-[#007fd4] ${getMethodColor(method)}`}
        >
          <span>{method}</span>
          <ChevronDown className="text-gray-400 shrink-0" size={16} />
        </button>
      </RadixDropdownMenu.Trigger>
      
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content 
          align="start"
          sideOffset={5}
          className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-md shadow-2xl py-1.5 z-50 min-w-[150px]"
          onClick={(e) => e.stopPropagation()}
        >
          {METHODS.map((m) => (
            <RadixDropdownMenu.Item 
              key={m.name}
              onSelect={() => {
                setMethod(m.name);
                setOpen(false);
              }}
              className={`flex items-center px-3 py-1.5 mx-1.5 my-0.5 rounded-md font-bold cursor-pointer text-[13px] outline-none transition-colors focus:bg-[#333333] ${method === m.name ? 'bg-[#333333]' : ''} ${m.color}`}
            >
              {m.name}
            </RadixDropdownMenu.Item>
          ))}
          
          <RadixDropdownMenu.Separator className="h-[1px] bg-[#2b2b2b] my-1 mx-2" />
          
          <div className="px-3 py-1.5 mx-1.5 my-0.5">
            <input 
              type="text"
              placeholder="Type a new method"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
              onKeyDown={handleCustomSubmit}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-[#cccccc] text-[12px] border-none outline-none placeholder-[#666666] font-normal"
            />
          </div>
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}
