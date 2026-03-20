'use client';

import React, { useState, useMemo } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { iconMap, iconCategories } from '@/lib/icon-map';

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const SelectedIcon = value ? iconMap[value] : undefined;

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return iconCategories;
    const q = search.toLowerCase();
    return iconCategories
      .map(cat => ({
        ...cat,
        icons: cat.icons.filter(name => name.toLowerCase().includes(q)),
      }))
      .filter(cat => cat.icons.length > 0);
  }, [search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[140px] justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            {SelectedIcon ? (
              <>
                <SelectedIcon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-xs">{value}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">아이콘 선택</span>
            )}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-2 border-b">
          <input
            className="w-full px-2 py-1.5 text-sm border rounded-md outline-none focus:ring-1 focus:ring-[#0052CC]"
            placeholder="아이콘 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">검색 결과가 없습니다</p>
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.label} className="mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                  {cat.label}
                </p>
                <div className="grid grid-cols-8 gap-1">
                  {cat.icons.map(name => {
                    const Icon = iconMap[name];
                    if (!Icon) return null;
                    const isSelected = value === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        title={name}
                        onClick={() => {
                          onChange(name);
                          setOpen(false);
                          setSearch('');
                        }}
                        className={`
                          flex items-center justify-center w-8 h-8 rounded-md transition-colors
                          ${isSelected ? 'bg-[#0052CC] text-white' : 'hover:bg-gray-100 text-gray-700'}
                        `}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
