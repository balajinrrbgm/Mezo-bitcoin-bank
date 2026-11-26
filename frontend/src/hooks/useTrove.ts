import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi'
import { parseEther, formatEther, parseUnits, formatUnits, zeroAddress } from 'viem'
import { useCallback } from 'react'
import { ADDRESSES, BIT_BANK_ROUTER_ABI, MUSD_ABI, PRICE_FEED_ABI } from '../constants/addresses'

// ──────────────────────────────────────────────
// Protocol stats
// ──────────────────────────────────────────────
export function useProtocolStats() {
  return useReadContract({
    address: ADDRESSES.BIT_BANK_ROUTER,
    abi: BIT_BANK_ROUTER_ABI,
    functionName: 'protocolStats',
  })
}

// ──────────────────────────────────────────────
// BTC Price
// ──────────────────────────────────────────────
export function useBTCPrice() {
  const result = useReadContract({
    address: ADDRESSES.PRICE_FEED as `0x${string}`,
    abi: PRICE_FEED_ABI,
    functionName: 'fetchPrice',
  })

  return {
    ...result,
    priceUSD: result.data ? Number(formatEther(result.data as bigint)) : undefined,
  }
}

// ──────────────────────────────────────────────
// Position health for a given address
// ──────────────────────────────────────────────
export function usePositionHealth(address?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.BIT_BANK_ROUTER,
    abi: BIT_BANK_ROUTER_ABI,
    functionName: 'getPositionHealth',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// ──────────────────────────────────────────────
// Borrowing fee preview
// ──────────────────────────────────────────────
export function useBorrowingInfo(debtAmount: string) {
  const parsed = debtAmount && parseFloat(debtAmount) > 0
    ? parseUnits(debtAmount, 18)
    : 0n

  return useReadContract({
    address: ADDRESSES.BIT_BANK_ROUTER,
    abi: BIT_BANK_ROUTER_ABI,
    functionName: 'borrowingInfo',
    args: [parsed],
    query: { enabled: parsed > 0n },
  })
}

// ──────────────────────────────────────────────
// Max safe debt for collateral amount
// ──────────────────────────────────────────────
export function useMaxSafeDebt(collateral: string, targetICRBps = 250n * 10n ** 16n) {
  const parsed = collateral && parseFloat(collateral) > 0
    ? parseEther(collateral)
    : 0n

  return useReadContract({
    address: ADDRESSES.BIT_BANK_ROUTER,
    abi: BIT_BANK_ROUTER_ABI,
    functionName: 'maxSafeDebt',
    args: [parsed, targetICRBps],
    query: { enabled: parsed > 0n },
  })
}

// ──────────────────────────────────────────────
// MUSD balance
// ──────────────────────────────────────────────
export function useMUSDBalance(address?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.MUSD as `0x${string}`,
    abi: MUSD_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// ──────────────────────────────────────────────
// MUSD allowance for BitBankRouter
// ──────────────────────────────────────────────
export function useMUSDAllowance(owner?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.MUSD as `0x${string}`,
    abi: MUSD_ABI,
    functionName: 'allowance',
    args: owner ? [owner, ADDRESSES.BIT_BANK_ROUTER] : undefined,
    query: { enabled: !!owner },
  })
}

// ──────────────────────────────────────────────
// Position snapshot
// ──────────────────────────────────────────────
export function usePositionSnapshot(address?: `0x${string}`) {
  return useReadContract({
    address: ADDRESSES.BIT_BANK_ROUTER,
    abi: BIT_BANK_ROUTER_ABI,
    functionName: 'snapshots',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })
}

// ──────────────────────────────────────────────
// Open position
// ──────────────────────────────────────────────
export function useOpenPosition() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const openPosition = useCallback(async (collateralBTC: string, debtMUSD: string) => {
    const value = parseEther(collateralBTC)
    const debt = parseUnits(debtMUSD, 18)
    return writeContractAsync({
      address: ADDRESSES.BIT_BANK_ROUTER,
      abi: BIT_BANK_ROUTER_ABI,
      functionName: 'openPosition',
      args: [debt, zeroAddress, zeroAddress],
      value,
    })
  }, [writeContractAsync])

  return { openPosition, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Close position
// ──────────────────────────────────────────────
export function useClosePosition() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const closePosition = useCallback(async () => {
    return writeContractAsync({
      address: ADDRESSES.BIT_BANK_ROUTER,
      abi: BIT_BANK_ROUTER_ABI,
      functionName: 'closePosition',
    })
  }, [writeContractAsync])

  return { closePosition, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Add collateral
// ──────────────────────────────────────────────
export function useAddCollateral() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const addCollateral = useCallback(async (amountBTC: string) => {
    return writeContractAsync({
      address: ADDRESSES.BIT_BANK_ROUTER,
      abi: BIT_BANK_ROUTER_ABI,
      functionName: 'addCollateral',
      args: [zeroAddress, zeroAddress],
      value: parseEther(amountBTC),
    })
  }, [writeContractAsync])

  return { addCollateral, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Withdraw collateral
// ──────────────────────────────────────────────
export function useWithdrawCollateral() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdrawCollateral = useCallback(async (amountBTC: string) => {
    return writeContractAsync({
      address: ADDRESSES.BIT_BANK_ROUTER,
      abi: BIT_BANK_ROUTER_ABI,
      functionName: 'withdrawCollateral',
      args: [parseEther(amountBTC), zeroAddress, zeroAddress],
    })
  }, [writeContractAsync])

  return { withdrawCollateral, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Borrow more MUSD
// ──────────────────────────────────────────────
export function useBorrowMUSD() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const borrowMUSD = useCallback(async (amount: string) => {
    return writeContractAsync({
      address: ADDRESSES.BIT_BANK_ROUTER,
      abi: BIT_BANK_ROUTER_ABI,
      functionName: 'borrowMUSD',
      args: [parseUnits(amount, 18), zeroAddress, zeroAddress],
    })
  }, [writeContractAsync])

  return { borrowMUSD, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Repay MUSD
// ──────────────────────────────────────────────
export function useRepayMUSD() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const repayMUSD = useCallback(async (amount: string) => {
    return writeContractAsync({
      address: ADDRESSES.BIT_BANK_ROUTER,
      abi: BIT_BANK_ROUTER_ABI,
      functionName: 'repayMUSD',
      args: [parseUnits(amount, 18), zeroAddress, zeroAddress],
    })
  }, [writeContractAsync])

  return { repayMUSD, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Approve MUSD for router spends
// ──────────────────────────────────────────────
export function useApproveMUSD() {
  const { writeContractAsync, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = useCallback(async (amount: bigint) => {
    return writeContractAsync({
      address: ADDRESSES.MUSD as `0x${string}`,
      abi: MUSD_ABI,
      functionName: 'approve',
      args: [ADDRESSES.BIT_BANK_ROUTER, amount],
    })
  }, [writeContractAsync])

  return { approve, isPending, isConfirming, isSuccess, hash }
}

// ──────────────────────────────────────────────
// Composite hook: all user state
// ──────────────────────────────────────────────
export function useUserState() {
  const { address } = useAccount()
  const btcBalance = useBalance({ address })
  const musdBalance = useMUSDBalance(address)
  const positionHealth = usePositionHealth(address)
  const positionSnapshot = usePositionSnapshot(address)
  const musdAllowance = useMUSDAllowance(address)

  const health = positionHealth.data as
    | readonly [bigint, bigint, bigint, number, bigint, boolean, boolean]
    | undefined

  const snapshot = positionSnapshot.data as
    | readonly [bigint, bigint, bigint, bigint]
    | undefined

  const hasPosition = health ? health[3] === 1 : false

  const icrPercent = health && health[2] > 0n
    ? Number(health[2]) / 1e16
    : undefined

  return {
    address,
    btcBalance: btcBalance.data?.value,
    btcBalanceFormatted: btcBalance.data ? parseFloat(formatEther(btcBalance.data.value)).toFixed(6) : '0',
    musdBalance: musdBalance.data as bigint | undefined,
    musdBalanceFormatted: musdBalance.data ? parseFloat(formatUnits(musdBalance.data as bigint, 18)).toFixed(2) : '0',
    hasPosition,
    collateral: health?.[0],
    debt: health?.[1],
    icr: health?.[2],
    icrPercent,
    status: health?.[3],
    btcPriceUSD: health?.[4],
    isSafe: health?.[5],
    isWarning: health?.[6],
    openedAt: snapshot?.[0],
    totalBorrowed: snapshot?.[2],
    totalRepaid: snapshot?.[3],
    musdAllowance: musdAllowance.data as bigint | undefined,
    isLoading: positionHealth.isLoading || musdBalance.isLoading,
    refetch: () => {
      positionHealth.refetch()
      musdBalance.refetch()
      btcBalance.refetch()
      positionSnapshot.refetch()
      musdAllowance.refetch()
    },
  }
}
