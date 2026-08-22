import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Check, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  id: string;
  name: string;
  sublabel?: string;
  icon?: ReactNode;
  flag?: string;
}

interface LocationComboboxProps {
  id: string;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  disabledPlaceholder?: string;
  loading?: boolean;
  loadingText?: string;
  error?: string | null;
  onRetry?: () => void;
  options: ComboboxOption[];
  value: string; // selected option ID or Name
  onChange: (option: ComboboxOption) => void;
  onSearchChange?: (query: string) => void;
  icon?: ReactNode;
  className?: string;
  errorText?: string;
}

export function LocationCombobox({
  id,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  disabledPlaceholder = 'Select a country first',
  loading = false,
  loadingText = 'Loading...',
  error = null,
  onRetry,
  options,
  value,
  onChange,
  onSearchChange,
  icon,
  className,
  errorText,
}: LocationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find(
    (opt) => opt.id.toLowerCase() === value.toLowerCase() || opt.name.toLowerCase() === value.toLowerCase()
  );

  // Filter options locally if onSearchChange is not provided
  const filteredOptions = onSearchChange
    ? options
    : options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (option: ComboboxOption) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    setActiveIndex(-1);
    if (onSearchChange) {
      onSearchChange(query);
    }
  };

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={cn(
          'w-full h-11 px-3.5 rounded-lg border bg-parchment-50 font-sans text-left transition-all duration-200 flex items-center justify-between gap-2',
          disabled
            ? 'opacity-60 bg-parchment-200/60 border-midnight/10 cursor-not-allowed text-ink/40'
            : 'border-midnight/20 hover:border-teal/60 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal text-ink cursor-pointer shadow-sm',
          errorText && 'border-coral ring-1 ring-coral/40',
          isOpen && 'border-teal ring-2 ring-teal/30'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-ink/40 flex-shrink-0">{icon}</span>}
          {selectedOption?.flag && (
            <span className="text-base flex-shrink-0 leading-none">{selectedOption.flag}</span>
          )}
          <span
            className={cn(
              'truncate text-sm',
              !selectedOption ? 'text-ink/40 font-normal' : 'text-ink font-medium'
            )}
          >
            {disabled
              ? disabledPlaceholder
              : selectedOption
              ? `${selectedOption.name}${selectedOption.sublabel ? `, ${selectedOption.sublabel}` : ''}`
              : placeholder}
          </span>
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-ink/40 transition-transform duration-200 flex-shrink-0',
            isOpen && 'rotate-180 text-teal'
          )}
          aria-hidden
        />
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-midnight/15 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden"
          >
            {/* Search Input Box */}
            <div className="p-2 border-b border-midnight/10 bg-parchment-100/50">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-3.5 h-3.5 text-ink/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-7 text-xs font-sans bg-parchment-50 border border-midnight/15 rounded-md text-ink placeholder:text-ink/40 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30"
                  aria-label={searchPlaceholder}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => handleSearchInput('')}
                    className="absolute right-2 text-ink/40 hover:text-ink p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Listbox */}
            <ul
              ref={listboxRef}
              role="listbox"
              aria-label={placeholder}
              className="max-h-56 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-midnight/20 divide-y divide-midnight/5"
            >
              {loading ? (
                <li className="flex items-center justify-center gap-2 py-6 text-xs text-ink/60 font-sans">
                  <Loader2 className="w-4 h-4 text-teal animate-spin" />
                  <span>{loadingText}</span>
                </li>
              ) : error ? (
                <li className="p-4 text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs text-coral font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                  </div>
                  {onRetry && (
                    <div>
                      <button
                        type="button"
                        onClick={onRetry}
                        className="text-xs text-teal font-semibold hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="py-6 px-4 text-center">
                  <p className="font-sans text-xs font-semibold text-ink/70">No results found</p>
                  <p className="font-sans text-[11px] text-ink/45 mt-0.5">Try a different search query.</p>
                </li>
              ) : (
                filteredOptions.map((option, idx) => {
                  const isSelected =
                    option.id.toLowerCase() === value.toLowerCase() ||
                    option.name.toLowerCase() === value.toLowerCase();
                  const isFocused = idx === activeIndex;

                  return (
                    <li
                      key={option.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 text-xs font-sans cursor-pointer transition-colors duration-150',
                        isSelected
                          ? 'bg-teal/10 text-teal font-semibold'
                          : isFocused
                          ? 'bg-parchment-200/70 text-ink'
                          : 'text-ink/80 hover:bg-parchment-100'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {option.flag ? (
                          <span className="text-base leading-none flex-shrink-0">{option.flag}</span>
                        ) : (
                          option.icon && (
                            <span className="text-ink/40 flex-shrink-0">{option.icon}</span>
                          )
                        )}
                        <div className="truncate">
                          <span className="text-ink font-medium">{option.name}</span>
                          {option.sublabel && (
                            <span className="ml-1.5 text-[11px] text-ink/50 font-normal">
                              ({option.sublabel})
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && <Check className="w-3.5 h-3.5 text-teal flex-shrink-0 ml-2" />}
                    </li>
                  );
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
