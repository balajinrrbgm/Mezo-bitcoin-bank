# BitBank — Bitcoin Self-Service Bank on Mezo

> **Mezo Hackathon: Building Bitcoin's Future**  
> Track: **Bank on Bitcoin — Bitcoin Track**

## Overview

BitBank is a self-service banking experience for Bitcoin holders built on Mezo. It wraps Mezo's BorrowerOperations contract in a clean, intuitive UI — turning a complex DeFi protocol into something that feels like a modern banking app.

Use your Bitcoin as collateral, draw a credit line in MUSD, manage your position with real-time health monitoring, and never worry about surprise liquidations thanks to live collateral ratio warnings.

```
User's Bitcoin Wallet
         ↓
   BitBankRouter.sol          ← Convenience wrapper
         ↓
  BorrowerOperations.sol      ← Mezo protocol
         ↓
  Opens Trove with BTC collateral
         ↓
  Receives MUSD (1-time 1% fee)
         ↓
  Real-time health monitoring
```

## Key Features

| Feature | Description |
|---------|-------------|
| 🏦 **Banking UI** | Position management feels like a bank account, not DeFi |
| 📊 **Health Monitor** | Live ICR gauge with green/yellow/red zones |
| ⚡ **Smart Suggestions** | "Safe Max" borrow calculation at target ICR |
| 🔧 **Full Control** | Add/withdraw collateral, borrow more, repay — all in one screen |
| 📈 **Position Analytics** | Track total borrowed, repaid, opened date |
| 🛡 **No Liquidation Surprises** | Warning at 150% ICR, safe zone above 200% |

## Architecture

```
contracts/
  contracts/
    BitBankRouter.sol               ← Main router (analytics + convenience)
    interfaces/
      IBorrowerOperations.sol       ← Mezo BO interface
      ITroveManager.sol             ← Trove state reader
      IPriceFeed.sol                ← Live BTC price
  scripts/deploy.ts
frontend/
  src/
    constants/addresses.ts         ← Matsnet addresses + ABIs
    config/wagmi.ts                ← @mezo-org/passport config
    hooks/useTrove.ts              ← All trove hooks
    components/
      Header.tsx                   ← Connect + network badge
      AccountDashboard.tsx         ← Protocol stats overview
      BorrowForm.tsx               ← Open/borrow flow with preview
      PositionPanel.tsx            ← Health + collateral + repay management
      HealthIndicator.tsx          ← Visual ICR gauge with thresholds
    App.tsx
```

## Matsnet Deployed Addresses

| Contract | Address |
|----------|---------|
| MUSD | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |
| BorrowerOperations | `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5` |
| TroveManager | `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0` |
| PriceFeed | `0x86bCF0841622a5dAC14A313a15f96A95421b9366` |
| BitBankRouter | *(deploy and update `addresses.ts`)* |

## Quick Start

### Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env: DEPLOYER_PRIVATE_KEY=0x...

npm run compile
npm run test
npm run deploy:matsnet
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Update `BIT_BANK_ROUTER` in `frontend/src/constants/addresses.ts`.

## User Flow

### Opening a Position
1. Connect Bitcoin wallet via Mezo Passport
2. Enter BTC amount to deposit as collateral
3. Set MUSD amount to borrow — use "Safe Max" for guidance
4. Preview shows projected collateral ratio + fees
5. One click opens position — funds arrive instantly

### Managing a Position
- **Add Collateral**: Top up BTC to improve health ratio
- **Borrow More**: Draw additional MUSD (stays within safe limits)
- **Repay**: Reduce debt to improve ICR
- **Close**: Fully repay and reclaim all BTC collateral

## Health Factor Explained

| ICR | Status | Description |
|-----|--------|-------------|
| ≥ 200% | 🟢 Safe | Well-collateralized, no risk |
| 150–200% | 🟡 Warning | Monitor closely — near minimum |
| < 150% | 🔴 At Risk | Can be liquidated immediately |

Recommended: maintain **250%+** for a safety buffer against BTC price drops.

## Hackathon Scoring Alignment

| Criterion | Score | How We Deliver |
|-----------|-------|----------------|
| Mezo Integration | 30% | Wraps BorrowerOperations + TroveManager + PriceFeed |
| Technical | 20% | Router contract with health calculations, SafeERC20 |
| Business Viability | 30% | Banking UX for Bitcoin holders is a massive market |
| UX | 10% | Real-time health gauge, preview, one-screen management |
| Presentation | 10% | Clean banking aesthetic, gold/navy theme |

## Network Info

- **Chain**: Mezo Matsnet Testnet (Chain ID: 31611)
- **RPC**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org

## License

MIT
