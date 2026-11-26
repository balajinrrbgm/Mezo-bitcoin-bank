import { formatEther, formatUnits } from 'viem'
import { useUserState, useClosePosition, useAddCollateral, useWithdrawCollateral, useRepayMUSD, useApproveMUSD } from '../hooks/useTrove'
import { HealthIndicator } from './HealthIndicator'
import { useState } from 'react'

function InfoRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-bank-border last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-white">{value}</span>
        {sub && <span className="text-xs text-gray-500 ml-1">{sub}</span>}
      </div>
    </div>
  )
}

export function PositionPanel() {
  const user = useUserState()
  const { closePosition, isPending: closePending } = useClosePosition()
  const { addCollateral, isPending: addCollPending } = useAddCollateral()
  const { withdrawCollateral, isPending: withdrawCollPending } = useWithdrawCollateral()
  const { repayMUSD, isPending: repayPending } = useRepayMUSD()
  const { approve, isPending: approvePending } = useApproveMUSD()

  const [addCollAmount, setAddCollAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [txError, setTxError] = useState('')

  if (!user.address) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">₿</div>
        <p className="text-gray-400">Connect your Bitcoin wallet to view your position.</p>
      </div>
    )
  }

  if (!user.hasPosition) {
    return (
      <div className="card text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-bank-border/50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏦</span>
        </div>
        <p className="text-lg font-semibold text-white mb-2">No Open Position</p>
        <p className="text-sm text-gray-400">Open a position below to start borrowing MUSD against your Bitcoin.</p>
      </div>
    )
  }

  const collBTC = user.collateral ? parseFloat(formatEther(user.collateral)).toFixed(6) : '—'
  const debtMUSD = user.debt ? parseFloat(formatUnits(user.debt, 18)).toFixed(2) : '—'
  const btcPrice = user.btcPriceUSD ? parseFloat(formatEther(user.btcPriceUSD)).toFixed(2) : '—'
  const collValueUSD = user.collateral && user.btcPriceUSD
    ? (parseFloat(formatEther(user.collateral)) * parseFloat(formatEther(user.btcPriceUSD))).toFixed(2)
    : '—'
  const openedDate = user.openedAt
    ? new Date(Number(user.openedAt) * 1000).toLocaleDateString()
    : '—'

  const handleClose = async () => {
    setTxError('')
    try {
      // Check allowance first
      const debtBn = user.debt ?? 0n
      if ((user.musdAllowance ?? 0n) < debtBn) {
        await approve(debtBn)
      }
      await closePosition()
      user.refetch()
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const handleAddColl = async () => {
    if (!addCollAmount) return
    setTxError('')
    try {
      await addCollateral(addCollAmount)
      setAddCollAmount('')
      user.refetch()
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const handleWithdrawColl = async () => {
    if (!withdrawAmount) return
    setTxError('')
    try {
      await withdrawCollateral(withdrawAmount)
      setWithdrawAmount('')
      user.refetch()
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const handleRepay = async () => {
    if (!repayAmount) return
    setTxError('')
    try {
      const amount = BigInt(Math.floor(parseFloat(repayAmount) * 1e18))
      if ((user.musdAllowance ?? 0n) < amount) {
        await approve(amount)
      }
      await repayMUSD(repayAmount)
      setRepayAmount('')
      user.refetch()
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const anyPending = closePending || addCollPending || withdrawCollPending || repayPending || approvePending

  return (
    <div className="space-y-4" id="position">
      {/* Health card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white">Position Health</h3>
          <span className="text-xs text-gray-500">Updated live</span>
        </div>
        <HealthIndicator icrPercent={user.icrPercent} size="lg" />
      </div>

      {/* Position details */}
      <div className="card">
        <h3 className="font-display font-semibold text-white mb-2">Position Details</h3>
        <InfoRow label="Collateral" value={`${collBTC} BTC`} sub={`≈ $${collValueUSD}`} />
        <InfoRow label="Debt" value={`${debtMUSD} MUSD`} />
        <InfoRow label="BTC Price" value={`$${btcPrice}`} />
        <InfoRow label="Opened" value={openedDate} />
        <InfoRow label="Total Borrowed" value={user.totalBorrowed ? parseFloat(formatUnits(user.totalBorrowed, 18)).toFixed(2) : '—'} sub="MUSD lifetime" />
      </div>

      {txError && (
        <div className="text-xs text-bank-red bg-bank-red/10 border border-bank-red/30 rounded-xl px-4 py-3">
          {txError}
        </div>
      )}

      {/* Manage collateral */}
      <div className="card space-y-4" id="collateral">
        <h3 className="font-display font-semibold text-white">Manage Collateral</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Add BTC</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={addCollAmount}
                onChange={e => setAddCollAmount(e.target.value)}
                placeholder="0.001"
                className="flex-1 bg-bank-navy border border-bank-border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-btc/50"
              />
              <button
                onClick={handleAddColl}
                disabled={anyPending || !addCollAmount}
                className="px-3 py-2 rounded-xl bg-btc text-black text-xs font-bold hover:bg-btc/80 disabled:opacity-50 transition-all"
              >
                Add
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Withdraw BTC</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.0001"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0.001"
                className="flex-1 bg-bank-navy border border-bank-border rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-btc/50"
              />
              <button
                onClick={handleWithdrawColl}
                disabled={anyPending || !withdrawAmount}
                className="px-3 py-2 rounded-xl bg-bank-border text-white text-xs font-bold hover:bg-bank-border/80 disabled:opacity-50 transition-all"
              >
                Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Repay MUSD */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Repay Debt</h3>
          <span className="text-xs text-gray-500">Balance: {user.musdBalanceFormatted} MUSD</span>
        </div>
        <div className="flex gap-3">
          <input
            type="number"
            min="0"
            step="100"
            value={repayAmount}
            onChange={e => setRepayAmount(e.target.value)}
            placeholder="Enter MUSD amount"
            className="flex-1 bg-bank-navy border border-bank-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-btc/50"
          />
          <button
            onClick={() => setRepayAmount(user.debt ? parseFloat(formatUnits(user.debt, 18)).toFixed(2) : '')}
            className="text-xs text-btc hover:text-btc/80 font-medium"
          >
            Max
          </button>
          <button
            onClick={handleRepay}
            disabled={anyPending || !repayAmount}
            className="px-5 py-2.5 rounded-xl bg-mezo text-white text-sm font-semibold hover:bg-mezo/80 disabled:opacity-50 transition-all"
          >
            {repayPending || approvePending ? 'Pending…' : 'Repay'}
          </button>
        </div>
      </div>

      {/* Close position */}
      <div className="card border-bank-red/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Close Position</p>
            <p className="text-xs text-gray-500 mt-0.5">Fully repay debt and reclaim all collateral</p>
          </div>
          <button
            onClick={handleClose}
            disabled={anyPending}
            className="px-4 py-2 rounded-xl bg-bank-red/10 border border-bank-red/30 text-bank-red text-sm font-semibold hover:bg-bank-red/20 disabled:opacity-50 transition-all"
          >
            {closePending ? 'Closing…' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
