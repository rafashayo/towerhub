import { Listbox } from '@headlessui/react'
import { Check, ChevronsUpDown, type LucideIcon } from 'lucide-react'

export interface SelectOption<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
  badge?: string | number
}

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  className?: string
  placeholder?: string
}

export function Select<T extends string>({ value, onChange, options, className = '', placeholder = 'Select…' }: SelectProps<T>) {
  const selected = options.find((o) => o.value === value)
  const SelectedIcon = selected?.icon

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={`relative ${className}`}>
        <Listbox.Button
          className="input group flex w-full cursor-pointer items-center justify-between gap-2 !pr-3 text-left transition-colors
            hover:border-signal-600/70 data-[open]:border-signal-500 data-[open]:ring-1 data-[open]:ring-signal-500/40"
        >
          <span className="flex min-w-0 items-center gap-2">
            {SelectedIcon && <SelectedIcon size={14} className="shrink-0 text-signal-400" />}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          <ChevronsUpDown
            size={15}
            className="shrink-0 text-mist-400 transition-transform duration-150 group-data-[open]:rotate-180 group-data-[open]:text-signal-400"
          />
        </Listbox.Button>

        <Listbox.Options
          transition
          anchor="bottom start"
          className="z-30 mt-2 max-h-72 w-[var(--button-width)] origin-top overflow-auto rounded-lg border
            border-ink-600 bg-ink-850/97 p-1.5 shadow-glow-lg backdrop-blur-md transition duration-150 ease-out
            focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[leave]:duration-100"
        >
          {options.map((opt) => {
            const OptIcon = opt.icon
            return (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                className={({ focus, selected }) =>
                  `flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    focus ? 'bg-ink-700 text-white' : selected ? 'text-signal-300' : 'text-mist-300'
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    {OptIcon && <OptIcon size={14} className="shrink-0" />}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.badge !== undefined && (
                      <span className="badge !py-0.5 !text-[10px]">{opt.badge}</span>
                    )}
                    {selected && <Check size={14} className="shrink-0 text-signal-400" />}
                  </>
                )}
              </Listbox.Option>
            )
          })}
        </Listbox.Options>
      </div>
    </Listbox>
  )
}
