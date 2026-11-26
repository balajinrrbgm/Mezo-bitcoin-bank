import { ConnectButton } from '@rainbow-me/rainbowkit'

export function Header() {
  return (
    <header className="border-b border-bank-border bg-bank-dark/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-btc to-amber-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-black text-black">₿</span>
            </div>
            <div>
              <span className="font-display font-bold text-xl text-white tracking-tight">BitBank</span>
              <span className="ml-1.5 text-xs font-medium text-bank-gold/80 hidden sm:inline">on Mezo</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#position" className="text-gray-400 hover:text-white transition-colors">Position</a>
            <a href="#borrow" className="text-gray-400 hover:text-white transition-colors">Borrow</a>
            <a href="#collateral" className="text-gray-400 hover:text-white transition-colors">Collateral</a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Matsnet badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-bank-card border border-bank-border rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-bank-green animate-pulse-slow" />
              <span className="text-xs text-gray-400">Matsnet</span>
            </div>
            <ConnectButton
              chainStatus="none"
              showBalance={false}
              accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
