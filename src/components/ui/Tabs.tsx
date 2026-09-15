'use client'

interface Tab {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (key: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <nav
      className={`flex gap-1 overflow-x-auto border-b border-line ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={[
              'relative px-3.5 py-2.5 text-[13.5px] font-medium whitespace-nowrap transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 focus-visible:ring-inset rounded-t-lg',
              isActive
                ? 'text-plum'
                : 'text-ink-soft hover:text-ink',
            ].join(' ')}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={[
                    'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-xs font-medium',
                    isActive
                      ? 'bg-plum-light text-plum'
                      : 'bg-stone-100 text-ink-soft',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              )}
            </span>

            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute -bottom-px left-0 right-0 h-[2px] bg-plum rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
