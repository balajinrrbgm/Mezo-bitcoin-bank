import { useState } from 'react'
import { formatUnits } from 'viem'
import { useUserState, useOpenPosition, useBorrowMUSD, useApproveMUSD, useBorrowingInfo, useMaxSafeDebt } from '../hooks/useTrove'
import { useBTCPrice } from '../hooks/useTrove'
import { HealthBadge } from './HealthIndicator'

function estimateICR(collBTC: number, debtMUSD: number, btcPriceUSD: number): number {
  if (debtMUSD === 0) return Infinity
  return ((collBTC * btcPriceUSD) / debtMUSD) * 100
}

export function BorrowForm() {
  const user = useUserState()
  const { priceUSD: btcPrice } = useBTCPrice()
  const { openPosition, isPending: openPending, isSuccess: openSuccess } = useOpenPosition()
  const { borrowMUSD, isPending: borrowPending } = useBorrowMUSD()
  const { isPending: approvePending } = useApproveMUSD()

  const [collateral, setCollateral] = useState('')
  const [debt, setDebt] = useState('')
  const [txError, setTxError] = useState('')
  const [mode, setMode] = useState<'open' | 'borrow'>('open')

  const { data: borrowingInfo } = useBorrowingInfo(debt)
  const { data: maxDebt } = useMaxSafeDebt(collateral)

  const info = borrowingInfo as readonly [bigint, bigint, bigint] | undefined
  const feeAmt = info ? parseFloat(formatUnits(info[0], 18)).toFixed(2) : '0'
  const rateAmt = info ? (Number(info[1]) / 1e16).toFixed(2) : '1.00'
  const maxDebtFmt = maxDebt ? parseFloat(formatUnits(maxDebt as bigint, 18)).toFixed(2) : '—'

  const collNum = parseFloat(collateral) || 0
  const debtNum = parseFloat(debt) || 0
  const previewICR = btcPrice && collNum && debtNum
    ? estimateICR(collNum, debtNum, btcPrice)
    : undefined

  const anyPending = openPending || borrowPending || approvePending

  const handleOpen = async () => {
    setTxError('')
    if (!collateral || !debt) return
    try {
      await openPosition(collateral, debt)
      setCollateral('')
      setDebt('')
      user.refetch()
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  const handleBorrowMore = async () => {
    setTxError('')
    if (!debt) return
    try {
      await borrowMUSD(debt)
      setDebt('')
      user.refetch()
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Transaction failed')
    }
  }

  return (
    <div className="card space-y-5" id="borrow">
      {/* Mode selector */}
      {user.hasPosition && (
        <div className="flex gap-2 p-1 bg-bank-navy rounded-xl">
          <button
            onClick={() => setMode('open')}
            disabled
            className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-gray-500 cursor-not-allowed"
          >
            Open (active)
          </button>
          <button
            onClick={() => setMode('borrow')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'borrow' ? 'bg-mezo text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Borrow More
          </button>
        </div>
      )}

      {!user.hasPosition && (
        <div>
          <h3 className="font-display font-semibold text-white mb-1">Open Position</h3>
          <p className="text-xs text-gray-500">Deposit BTC as collateral and borrow MUSD in one transaction.</p>
        </div>
      )}

      {/* Collateral input — only for new positions */}
      {(!user.hasPosition || mode === 'open') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">BTC Collateral</label>
            <span className="text-xs text-gray-500">Balance: {user.btcBalanceFormatted} BTC</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.001"
              value={collateral}
              onChange={e => setCollateral(e.target.value)}
              placeholder="0.01"
              className="w-full bg-bank-navy border border-bank-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-btc/50 pr-20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button onClick={() => setCollateral(user.btcBalanceFormatted)} className="text-xs text-btc font-medium hover:text-btc/80">Max</button>
              <span className="text-sm font-bold text-btc">BTC</span>
            </div>
          </div>
          {collateral && btcPrice && (
            <p className="text-xs text-gray-500">
              ≈ ${(parseFloat(collateral) * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
              {!!maxDebt && <span className="ml-2 text-bank-green">Max safe debt: {maxDebtFmt} MUSD</span>}
            </p>
          )}
        </div>
      )}

      {/* Debt input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Borrow MUSD</label>
          <span className="text-xs text-gray-500">Min: 2,000 MUSD</span>
        </div>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="100"
            value={debt}
            onChange={e => setDebt(e.target.value)}
            placeholder="2000"
            className="w-full bg-bank-navy border border-bank-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-mezo/50 pr-24"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {!!maxDebt && (
              <button
                onClick={() => setDebt(parseFloat(formatUnits(maxDebt as bigint, 18)).toFixed(2))}
                className="text-xs text-mezo font-medium hover:text-mezo/80 mr-2"
              >
                Safe Max
              </button>
            )}
            <span className="text-sm font-bold text-mezo/80">MUSD</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      {(collateral || debt) && (
        <div className="bg-bank-navy rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction Preview</p>
          {previewICR !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Projected Health</span>
              <HealthBadge icrPercent={previewICR} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Borrowing Rate</span>
            <span className="text-xs text-white font-medium">{rateAmt}% (one-time)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Fee</span>
            <span className="text-xs text-white font-medium">{feeAmt} MUSD</span>
          </div>
          {debt && (
            <div className="flex items-center justify-between border-t border-bank-border pt-2 mt-2">
              <span className="text-xs text-gray-400">You receive</span>
              <span className="text-sm font-bold text-mezo">
                {(parseFloat(debt) - parseFloat(feeAmt)).toFixed(2)} MUSD
              </span>
            </div>
          )}
        </div>
      )}

      {txError && (
        <div className="text-xs text-bank-red bg-bank-red/10 border border-bank-red/30 rounded-xl px-4 py-3">
          {txError}
        </div>
      )}

      {/* Action button */}
      {!user.hasPosition ? (
        <button
          onClick={handleOpen}
          disabled={anyPending || !collateral || !debt}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-btc to-amber-600 text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-btc/20"
        >
          {openPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Opening Position…
            </span>
          ) : (
            '🏦 Open Bitcoin Position'
          )}
        </button>
      ) : (
        <button
          onClick={handleBorrowMore}
          disabled={anyPending || !debt}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-mezo to-purple-600 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {borrowPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Borrowing…
            </span>
          ) : (
            'Borrow More MUSD'
          )}
        </button>
      )}

      {openSuccess && (
        <div className="text-xs text-bank-green bg-bank-green/10 border border-bank-green/30 rounded-xl px-4 py-3 text-center">
          ✓ Position opened successfully! Your BTC is now earning yield through Mezo.
        </div>
      )}
    </div>
  )
}
