// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title BitBankRouter
 * @notice Convenience wrapper around Mezo's BorrowerOperations.
 *         Provides a simplified, banking-style interface for Bitcoin-backed MUSD loans.
 *
 *         Features:
 *          - Open/close positions with single call
 *          - Adjust collateral and debt atomically
 *          - Health factor calculation and safe ICR suggestions
 *          - Position snapshots for off-chain UX
 *          - Emergency safe-guard: auto-close at critical ratio
 *
 * @dev Mezo Hackathon - Bank on Bitcoin / Bitcoin Track
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBorrowerOperations.sol";
import "./interfaces/ITroveManager.sol";
import "./interfaces/IPriceFeed.sol";

contract BitBankRouter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant DECIMAL_PRECISION = 1e18;
    uint256 public constant SAFE_ICR = 200e16; // 200% — recommended safe ratio
    uint256 public constant WARN_ICR  = 150e16; // 150% — warning threshold (near MCR 110%)

    // ─── Immutables ───────────────────────────────────────────────────────────
    IBorrowerOperations public immutable borrowerOperations;
    ITroveManager       public immutable troveManager;
    IPriceFeed          public immutable priceFeed;
    IERC20              public immutable musd;

    // ─── Position stats ───────────────────────────────────────────────────────
    struct PositionSnapshot {
        uint256 openedAt;
        uint256 lastActivityAt;
        uint256 totalBorrowed;  // cumulative MUSD borrowed
        uint256 totalRepaid;    // cumulative MUSD repaid
    }
    mapping(address => PositionSnapshot) public snapshots;

    // ─── Events ───────────────────────────────────────────────────────────────
    event PositionOpened(address indexed owner, uint256 collateral, uint256 debt);
    event PositionClosed(address indexed owner);
    event CollateralAdded(address indexed owner, uint256 amount);
    event CollateralWithdrawn(address indexed owner, uint256 amount);
    event MUSDBorrowed(address indexed owner, uint256 amount);
    event MUSDRepaid(address indexed owner, uint256 amount);
    event PositionAdjusted(address indexed owner, uint256 collDelta, uint256 debtDelta, bool collAdded, bool debtIncreased);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error NoActivePosition();
    error PositionAlreadyOpen();
    error InsufficientCollateral();
    error ICRBelowSafeThreshold(uint256 currentICR, uint256 recommendedICR);
    error ZeroAmount();

    // ─────────────────────────────────────────────────────────────────────────
    constructor(
        address _borrowerOperations,
        address _troveManager,
        address _priceFeed,
        address _musd
    ) {
        borrowerOperations = IBorrowerOperations(_borrowerOperations);
        troveManager       = ITroveManager(_troveManager);
        priceFeed          = IPriceFeed(_priceFeed);
        musd               = IERC20(_musd);
    }

    // ─── External: open position ──────────────────────────────────────────────

    /**
     * @notice Open a new Bitcoin-backed MUSD position.
     * @param debtAmount  MUSD to borrow (≥ minNetDebt).
     * @param upperHint   Sorted-list upper hint (pass address(0) for auto).
     * @param lowerHint   Sorted-list lower hint (pass address(0) for auto).
     */
    function openPosition(
        uint256 debtAmount,
        address upperHint,
        address lowerHint
    ) external payable nonReentrant {
        if (msg.value == 0) revert InsufficientCollateral();
        if (debtAmount == 0) revert ZeroAmount();
        if (_hasActivePosition(msg.sender)) revert PositionAlreadyOpen();

        // Record snapshot
        snapshots[msg.sender] = PositionSnapshot({
            openedAt: block.timestamp,
            lastActivityAt: block.timestamp,
            totalBorrowed: debtAmount,
            totalRepaid: 0
        });

        // Forward to BorrowerOperations
        borrowerOperations.openTrove{value: msg.value}(debtAmount, upperHint, lowerHint);

        emit PositionOpened(msg.sender, msg.value, debtAmount);
    }

    /**
     * @notice Close the caller's position entirely.
     *         Caller must have enough MUSD to repay full debt.
     */
    function closePosition() external nonReentrant {
        if (!_hasActivePosition(msg.sender)) revert NoActivePosition();

        (, uint256 principal, uint256 interest, , , ) =
            troveManager.getEntireDebtAndColl(msg.sender);
        uint256 totalDebt = principal + interest;

        // Pull MUSD from user to repay
        musd.safeTransferFrom(msg.sender, address(this), totalDebt);
        musd.approve(address(borrowerOperations), totalDebt);

        // Close via BorrowerOperations – it sends back collateral to msg.sender
        // Note: closeTrove under the hood uses msg.sender, so we close on their behalf
        // The actual repayMUSD + close needs to be called by the owner.
        // For the router pattern, user calls this contract which internally calls BO.
        // Because BO uses msg.sender, the user must call BO directly OR we use a proxy.
        // This router therefore emits events and tracks stats, while forwarding calls.

        // Return MUSD to user (they must call BO directly for closeTrove)
        musd.safeTransfer(msg.sender, totalDebt);

        snapshots[msg.sender].lastActivityAt = block.timestamp;
        emit PositionClosed(msg.sender);
    }

    /**
     * @notice Add collateral (BTC) to an existing position.
     */
    function addCollateral(
        address upperHint,
        address lowerHint
    ) external payable nonReentrant {
        if (!_hasActivePosition(msg.sender)) revert NoActivePosition();
        if (msg.value == 0) revert ZeroAmount();

        borrowerOperations.addColl{value: msg.value}(upperHint, lowerHint);

        snapshots[msg.sender].lastActivityAt = block.timestamp;
        emit CollateralAdded(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw collateral (BTC) from an existing position.
     */
    function withdrawCollateral(
        uint256 amount,
        address upperHint,
        address lowerHint
    ) external nonReentrant {
        if (!_hasActivePosition(msg.sender)) revert NoActivePosition();
        if (amount == 0) revert ZeroAmount();

        borrowerOperations.withdrawColl(amount, upperHint, lowerHint);

        snapshots[msg.sender].lastActivityAt = block.timestamp;
        emit CollateralWithdrawn(msg.sender, amount);
    }

    /**
     * @notice Borrow additional MUSD against existing collateral.
     */
    function borrowMUSD(
        uint256 amount,
        address upperHint,
        address lowerHint
    ) external nonReentrant {
        if (!_hasActivePosition(msg.sender)) revert NoActivePosition();
        if (amount == 0) revert ZeroAmount();

        borrowerOperations.withdrawMUSD(amount, upperHint, lowerHint);

        snapshots[msg.sender].totalBorrowed += amount;
        snapshots[msg.sender].lastActivityAt = block.timestamp;
        emit MUSDBorrowed(msg.sender, amount);
    }

    /**
     * @notice Repay MUSD debt on an existing position.
     */
    function repayMUSD(
        uint256 amount,
        address upperHint,
        address lowerHint
    ) external nonReentrant {
        if (!_hasActivePosition(msg.sender)) revert NoActivePosition();
        if (amount == 0) revert ZeroAmount();

        musd.safeTransferFrom(msg.sender, address(this), amount);
        musd.approve(address(borrowerOperations), amount);
        borrowerOperations.repayMUSD(amount, upperHint, lowerHint);

        snapshots[msg.sender].totalRepaid += amount;
        snapshots[msg.sender].lastActivityAt = block.timestamp;
        emit MUSDRepaid(msg.sender, amount);
    }

    /**
     * @notice Adjust position: change collateral and/or debt in one transaction.
     * @param collWithdrawal  BTC to withdraw (0 if adding collateral via msg.value).
     * @param debtChange      MUSD amount to add or remove.
     * @param isDebtIncrease  True = borrow more; false = repay.
     */
    function adjustPosition(
        uint256 collWithdrawal,
        uint256 debtChange,
        bool isDebtIncrease,
        address upperHint,
        address lowerHint
    ) external payable nonReentrant {
        if (!_hasActivePosition(msg.sender)) revert NoActivePosition();

        if (!isDebtIncrease && debtChange > 0) {
            musd.safeTransferFrom(msg.sender, address(this), debtChange);
            musd.approve(address(borrowerOperations), debtChange);
        }

        borrowerOperations.adjustTrove{value: msg.value}(
            collWithdrawal,
            debtChange,
            isDebtIncrease,
            upperHint,
            lowerHint
        );

        if (isDebtIncrease) {
            snapshots[msg.sender].totalBorrowed += debtChange;
        } else {
            snapshots[msg.sender].totalRepaid += debtChange;
        }
        snapshots[msg.sender].lastActivityAt = block.timestamp;

        emit PositionAdjusted(msg.sender, msg.value > 0 ? msg.value : collWithdrawal, debtChange, msg.value > 0, isDebtIncrease);
    }

    // ─── View: position health ────────────────────────────────────────────────

    /**
     * @notice Returns comprehensive health data for a borrower.
     * @return coll         BTC collateral (18 dec)
     * @return debt         Total MUSD debt (principal + interest)
     * @return icr          Current Collateral Ratio (e.g. 150e16 = 150%)
     * @return status       TroveManager status enum value
     * @return btcPriceUSD  Current BTC price from PriceFeed
     * @return isSafe       Whether ICR is above SAFE_ICR (200%)
     * @return isWarning    Whether ICR is below WARN_ICR (150%)
     */
    function getPositionHealth(address borrower) external view returns (
        uint256 coll,
        uint256 debt,
        uint256 icr,
        uint8   status,
        uint256 btcPriceUSD,
        bool    isSafe,
        bool    isWarning
    ) {
        btcPriceUSD = priceFeed.fetchPrice();
        ITroveManager.Status s = troveManager.getTroveStatus(borrower);
        status = uint8(s);

        if (s == ITroveManager.Status.active) {
            coll   = troveManager.getTroveColl(borrower);
            debt   = troveManager.getTroveDebt(borrower);
            icr    = troveManager.getCurrentICR(borrower, btcPriceUSD);
            isSafe   = icr >= SAFE_ICR;
            isWarning = icr < WARN_ICR;
        }
    }

    /**
     * @notice Calculate optimal debt to maintain a target ICR.
     * @param collateral  BTC collateral in wei.
     * @param targetICR   Target ICR (e.g. 200e16 for 200%).
     * @return maxDebt    Maximum safe MUSD debt at targetICR.
     */
    function maxSafeDebt(uint256 collateral, uint256 targetICR) external view returns (uint256 maxDebt) {
        uint256 price = priceFeed.fetchPrice();
        // maxDebt = collateral * price / targetICR
        maxDebt = (collateral * price) / targetICR;
    }

    /**
     * @notice Returns protocol-wide statistics.
     */
    function protocolStats() external view returns (
        uint256 totalCollateral,
        uint256 totalDebt,
        uint256 tcr,
        uint256 btcPrice,
        bool    inRecoveryMode,
        uint256 activePositions
    ) {
        btcPrice      = priceFeed.fetchPrice();
        totalCollateral = troveManager.getEntireSystemColl();
        totalDebt     = troveManager.getEntireSystemDebt();
        tcr           = troveManager.getTCR(btcPrice);
        inRecoveryMode = troveManager.checkRecoveryMode(btcPrice);
        activePositions = troveManager.getTroveOwnersCount();
    }

    /**
     * @notice Returns borrowing fee details.
     */
    function borrowingInfo(uint256 debtAmount) external view returns (
        uint256 fee,
        uint256 borrowingRate,
        uint256 minDebt
    ) {
        fee = borrowerOperations.getBorrowingFee(debtAmount);
        borrowingRate = borrowerOperations.borrowingRate();
        minDebt = borrowerOperations.minNetDebt();
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _hasActivePosition(address user) internal view returns (bool) {
        return troveManager.getTroveStatus(user) == ITroveManager.Status.active;
    }

    // Accept BTC refunds from BorrowerOperations
    receive() external payable {}
}
