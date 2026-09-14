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
      className={`flex gap-1 overflow-x-auto border-b border-[#E8E0D4] ${className}`}
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
              'relative px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#87A878] focus-visible:ring-inset rounded-t-lg',
              isActive
                ? 'text-[#6B3A5B]'
                : 'text-[#6B7280] hover:text-[#2D2D2D]',
            ].join(' ')}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={[
                    'inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-xs font-medium',
                    isActive
                      ? 'bg-[#6B3A5B]/10 text-[#6B3A5B]'
                      : 'bg-gray-100 text-[#6B7280]',
                  ].join(' ')}
                >
                  {tab.count}
                </span>
              )}
            </span>

            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B3A5B] rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
