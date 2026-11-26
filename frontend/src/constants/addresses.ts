// Matsnet Testnet (Chain ID: 31611) deployed addresses
export const ADDRESSES = {
  MUSD: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  BORROWER_OPERATIONS: '0xCdF7028ceAB81fA0C6971208e83fa7872994beE5',
  TROVE_MANAGER: '0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0',
  STABILITY_POOL: '0x1CCA7E410eE41739792eA0A24e00349Dd247680e',
  HINT_HELPERS: '0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6',
  PRICE_FEED: '0x86bCF0841622a5dAC14A313a15f96A95421b9366',
  // Deploy BitBankRouter and update this address
  BIT_BANK_ROUTER: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const

export const MUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
] as const

export const BIT_BANK_ROUTER_ABI = [
  // Position management
  'function openPosition(uint256 debtAmount, address upperHint, address lowerHint) payable',
  'function closePosition()',
  'function addCollateral(address upperHint, address lowerHint) payable',
  'function withdrawCollateral(uint256 amount, address upperHint, address lowerHint)',
  'function borrowMUSD(uint256 amount, address upperHint, address lowerHint)',
  'function repayMUSD(uint256 amount, address upperHint, address lowerHint)',
  'function adjustPosition(uint256 collWithdrawal, uint256 debtChange, bool isDebtIncrease, address upperHint, address lowerHint) payable',
  // View functions
  'function getPositionHealth(address borrower) view returns (uint256 coll, uint256 debt, uint256 icr, uint8 status, uint256 btcPriceUSD, bool isSafe, bool isWarning)',
  'function maxSafeDebt(uint256 collateral, uint256 targetICR) view returns (uint256)',
  'function protocolStats() view returns (uint256 totalCollateral, uint256 totalDebt, uint256 tcr, uint256 btcPrice, bool inRecoveryMode, uint256 activePositions)',
  'function borrowingInfo(uint256 debtAmount) view returns (uint256 fee, uint256 borrowingRate, uint256 minDebt)',
  'function positionSnapshots(address) view returns (uint256 openedAt, uint256 lastActivityAt, uint256 totalBorrowed, uint256 totalRepaid)',
  // Events
  'event PositionOpened(address indexed borrower, uint256 collateral, uint256 debt)',
  'event PositionClosed(address indexed borrower)',
  'event CollateralAdded(address indexed borrower, uint256 amount)',
  'event CollateralWithdrawn(address indexed borrower, uint256 amount)',
  'event MUSDBorrowed(address indexed borrower, uint256 amount)',
  'event MUSDRepaid(address indexed borrower, uint256 amount)',
] as const

export const PRICE_FEED_ABI = [
  'function fetchPrice() view returns (uint256)',
] as const

export const TROVE_MANAGER_ABI = [
  'function getTroveStatus(address _borrower) view returns (uint256)',
  'function getTroveColl(address _borrower) view returns (uint256)',
  'function getTroveDebt(address _borrower) view returns (uint256)',
  'function getCurrentICR(address _borrower, uint256 _price) view returns (uint256)',
  'function getTroveStake(address _borrower) view returns (uint256)',
  'function getTroveRewardSnapshots(address _borrower) view returns (uint256, uint256)',
  'function getEntireDebtAndColl(address _borrower) view returns (uint256 debt, uint256 coll, uint256 pendingLUSDDebt, uint256 pendingETHReward)',
  'function getBorrowingRateWithDecay() view returns (uint256)',
  'function getBorrowingFeeWithDecay(uint256 musdDebt) view returns (uint256)',
  'function getTCR(uint256 price) view returns (uint256)',
  'function getTroveFromTroveOwnersArray(uint256 _index) view returns (address)',
  'function getTroveOwnersCount() view returns (uint256)',
] as const

// Trove status enum values
export const TROVE_STATUS = {
  0: 'nonExistent',
  1: 'active',
  2: 'closedByOwner',
  3: 'closedByLiquidation',
  4: 'closedByRedemption',
} as const

// ICR thresholds - 18 decimal fixed point
export const ICR_SAFE = 200n * 10n ** 16n    // 200%
export const ICR_WARNING = 150n * 10n ** 16n  // 150% (MCR)
export const ICR_TARGET = 250n * 10n ** 16n   // 250% recommended

// Minimum debt: 2000 MUSD
export const MIN_DEBT = 2000n * 10n ** 18n
