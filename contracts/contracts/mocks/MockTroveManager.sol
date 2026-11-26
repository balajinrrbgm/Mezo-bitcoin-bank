// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @notice MockTroveManager — returns synthetic data for BitBankRouter tests.
 */
contract MockTroveManager {
    mapping(address => uint256) public troveCollateral;
    mapping(address => uint256) public troveDebt;
    mapping(address => uint8)  public troveStatus;

    uint256 public constant MCR = 11e17; // 110%
    uint256 public constant CCR = 15e17; // 150%

    // Can be set by test to simulate different scenarios
    uint256 public mockPrice = 60_000e18; // $60,000
    uint256 public mockTCR = 200e16;       // 200%
    bool    public mockRecoveryMode = false;
    uint256 public mockTroveCount = 5;

    function setMockState(
        address borrower,
        uint256 coll,
        uint256 debt_,
        uint8   status_
    ) external {
        troveCollateral[borrower] = coll;
        troveDebt[borrower] = debt_;
        troveStatus[borrower] = status_;
    }

    function setMockPrice(uint256 price) external { mockPrice = price; }
    function setMockTCR(uint256 tcr) external { mockTCR = tcr; }
    function setRecoveryMode(bool rm) external { mockRecoveryMode = rm; }

    function getTroveStatus(address b) external view returns (uint256) {
        return troveStatus[b];
    }

    function getTroveColl(address b) external view returns (uint256) {
        return troveCollateral[b];
    }

    function getTroveDebt(address b) external view returns (uint256) {
        return troveDebt[b];
    }

    function getCurrentICR(address b, uint256 price) external view returns (uint256) {
        uint256 d = troveDebt[b];
        if (d == 0) return type(uint256).max;
        return (troveCollateral[b] * price) / d;
    }

    function getTCR(uint256) external view returns (uint256) {
        return mockTCR;
    }

    function checkRecoveryMode(uint256) external view returns (bool) {
        return mockRecoveryMode;
    }

    function getTroveOwnersCount() external view returns (uint256) {
        return mockTroveCount;
    }

    function getBorrowingRateWithDecay() external pure returns (uint256) {
        return 1e16; // 1%
    }

    function getBorrowingFeeWithDecay(uint256 debt_) external pure returns (uint256) {
        return debt_ / 100; // 1%
    }

    function getEntireSystemColl() external pure returns (uint256) {
        return 10e18; // 10 BTC mock
    }

    function getEntireSystemDebt() external pure returns (uint256) {
        return 100_000e18; // 100k MUSD mock
    }

    function MCR_() external pure returns (uint256) { return 11e17; }
    function CCR_() external pure returns (uint256) { return 15e17; }

    function getNominalICR(address) external pure returns (uint256) { return 0; }
    function getTrovePrincipal(address) external pure returns (uint256) { return 0; }
    function getTroveInterestOwed(address) external pure returns (uint256) { return 0; }

    function getEntireDebtAndColl(address) external pure returns (
        uint256, uint256, uint256, uint256, uint256, uint256
    ) {
        return (0, 0, 0, 0, 0, 0);
    }
}
