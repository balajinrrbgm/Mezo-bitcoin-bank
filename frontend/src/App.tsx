import { useAccount } from 'wagmi'
import { Header } from './components/Header'
import { AccountDashboard } from './components/AccountDashboard'
import { PositionPanel } from './components/PositionPanel'
import { BorrowForm } from './components/BorrowForm'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useUserState } from './hooks/useTrove'

function HeroSection() {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center gap-2 bg-btc/10 border border-btc/20 rounded-full px-4 py-1.5 mb-6">
        <span className="text-btc text-xs font-bold">₿</span>
        <span className="text-xs font-medium text-gray-300">Bitcoin-backed lending on Mezo</span>
      </div>
      <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4">
        Your Bitcoin.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-btc to-amber-400">
          Your Liquidity.
        </span>
      </h1>
      <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
        Deposit BTC as collateral and borrow MUSD instantly. Fixed 1% rate, no variable surprises.
        Full custody through Mezo's secure protocol.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <ConnectButton label="Connect Bitcoin Wallet" />
      </div>
      <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="text-bank-green">✓</span> 1% Fixed Rate
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-bank-green">✓</span> No KYC
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-bank-green">✓</span> Non-Custodial
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-bank-green">✓</span> Instant Liquidity
        </div>
      </div>
    </div>
  )
}

function WalletStats() {
  const user = useUserState()
  if (!user.address) return null

  return (
    <div className="flex flex-wrap gap-3 justify-center mb-8">
      <div className="bg-bank-card border border-bank-border rounded-xl px-4 py-2 flex items-center gap-2">
        <span className="text-btc">₿</span>
        <div>
          <p className="text-xs text-gray-500">BTC Balance</p>
          <p className="text-sm font-bold text-white">{user.btcBalanceFormatted}</p>
        </div>
      </div>
      <div className="bg-bank-card border border-bank-border rounded-xl px-4 py-2 flex items-center gap-2">
        <span className="text-mezo">M</span>
        <div>
          <p className="text-xs text-gray-500">MUSD Balance</p>
          <p className="text-sm font-bold text-white">{user.musdBalanceFormatted}</p>
        </div>
      </div>
      {user.hasPosition && (
        <div className="bg-bank-card border border-bank-border rounded-xl px-4 py-2">
          <p className="text-xs text-gray-500">Position Health</p>
          <p className={`text-sm font-bold ${user.isSafe ? 'text-bank-green' : user.isWarning ? 'text-bank-yellow' : 'text-bank-red'}`}>
            {user.icrPercent ? `${user.icrPercent.toFixed(1)}%` : '—'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {!isConnected ? (
          <HeroSection />
        ) : (
          <div className="pt-8 animate-fade-in">
            <WalletStats />

            <div className="space-y-8">
              {/* Protocol overview */}
              <AccountDashboard />

              {/* Main grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Borrow / Open */}
                <div className="space-y-4">
                  <h2 className="font-display font-semibold text-lg text-white">Borrow</h2>
                  <BorrowForm />
                </div>

                {/* Right: Position management */}
                <div className="space-y-4">
                  <h2 className="font-display font-semibold text-lg text-white">My Position</h2>
                  <PositionPanel />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-bank-border py-8 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div>BitBank — Built on Mezo · Matsnet Testnet</div>
          <div className="flex items-center gap-4">
            <a href="https://explorer.test.mezo.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Explorer</a>
            <a href="https://mezo.org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">Mezo.org</a>
            <a href="https://github.com/mezo-org" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
