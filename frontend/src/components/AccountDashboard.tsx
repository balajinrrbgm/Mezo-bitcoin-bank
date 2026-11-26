import { formatEther, formatUnits } from 'viem'
import { useProtocolStats, useBTCPrice } from '../hooks/useTrove'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-display font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export function AccountDashboard() {
  const { data: stats } = useProtocolStats()
  const { priceUSD } = useBTCPrice()

  const [totalColl, totalDebt, tcr, , inRecoveryMode, activePositions] =
    (stats as readonly [bigint, bigint, bigint, bigint, boolean, bigint] | undefined) ?? []

  const tcrPct = tcr ? (Number(tcr) / 1e16).toFixed(1) : '—'
  const totalCollBTC = totalColl ? parseFloat(formatEther(totalColl)).toFixed(4) : '—'
  const totalDebtMUSD = totalDebt ? parseFloat(formatUnits(totalDebt, 18)).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'
  const tvlUSD = totalColl && priceUSD
    ? (parseFloat(formatEther(totalColl)) * priceUSD).toLocaleString(undefined, { maximumFractionDigits: 0 })
    : '—'
  const activePosNum = activePositions ? activePositions.toString() : '—'

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-white">Protocol Overview</h2>
        {inRecoveryMode && (
          <span className="text-xs font-bold text-bank-red bg-bank-red/10 border border-bank-red/30 rounded-full px-3 py-1">
            ⚠ Recovery Mode Active
          </span>
        )}
        {inRecoveryMode === false && (
          <span className="text-xs font-bold text-bank-green bg-bank-green/10 border border-bank-green/30 rounded-full px-3 py-1">
            ✓ Normal Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Value Locked"
          value={`$${tvlUSD}`}
          sub={`${totalCollBTC} BTC`}
        />
        <StatCard
          label="MUSD Outstanding"
          value={`${totalDebtMUSD}`}
          sub="MUSD"
        />
        <StatCard
          label="System Ratio"
          value={`${tcrPct}%`}
          sub="Total Collateral Ratio"
        />
        <StatCard
          label="Active Positions"
          value={activePosNum}
          sub="open troves"
        />
      </div>

      {/* Rate info */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-btc/5 border-btc/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-btc/20 flex items-center justify-center">
            <span className="text-xl">₿</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Fixed 1% Borrowing Rate</p>
            <p className="text-xs text-gray-400">No variable rate surprises — one-time fee on borrow</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500">Min. Collateral Ratio</p>
            <p className="text-sm font-bold text-bank-yellow">150%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Recommended</p>
            <p className="text-sm font-bold text-bank-green">250%+</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">BTC Price</p>
            <p className="text-sm font-bold text-btc">${priceUSD?.toLocaleString(undefined, { maximumFractionDigits: 0 }) ?? '—'}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
