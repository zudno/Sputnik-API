import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';

export interface DropdownItemProps {
  label: string;
  onClick: (e: Event) => void;
  icon?: ReactNode;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItemProps[];
  align?: 'start' | 'center' | 'end';
}

export function Dropdown({ trigger, items, align = 'end' }: DropdownProps) {
  return (
    <RadixDropdownMenu.Root modal={false}>
      <RadixDropdownMenu.Trigger asChild>
        {trigger}
      </RadixDropdownMenu.Trigger>
      
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content 
          align={align}
          sideOffset={5} 
          className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-md shadow-2xl py-1.5 z-50 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => (
            <RadixDropdownMenu.Item 
              key={idx}
              onSelect={item.onClick}
              className={`flex items-center gap-2 px-3 py-1.5 mx-1.5 my-0.5 rounded-md cursor-pointer text-[13px] font-sans outline-none transition-colors
                ${item.danger 
                  ? 'text-red-400 focus:bg-red-500/10 focus:text-red-400' 
                  : 'text-[#cccccc] focus:bg-[#333333] focus:text-white'}`}
            >
              {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
              {item.label}
            </RadixDropdownMenu.Item>
          ))}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}
