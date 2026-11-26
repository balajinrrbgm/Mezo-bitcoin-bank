// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice MockBorrowerOperations — simulates the Mezo BorrowerOperations contract for tests.
 */
contract MockBorrowerOperations {
    IERC20 public musd;

    // trove state per user
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;
    mapping(address => uint8) public status; // 0=nonExistent, 1=active, 2=closed

    uint256 public constant BORROWING_RATE = 1e16; // 1%
    uint256 public constant MIN_NET_DEBT = 2000e18; // 2000 MUSD

    constructor(address _musd) {
        musd = IERC20(_musd);
    }

    function openTrove(uint256 _debtAmount, address, address) external payable {
        require(msg.value > 0, "MockBO: no collateral");
        require(_debtAmount >= MIN_NET_DEBT, "MockBO: debt below min");
        require(status[msg.sender] != 1, "MockBO: trove already open");

        collateral[msg.sender] = msg.value;
        uint256 fee = (_debtAmount * BORROWING_RATE) / 1e18;
        debt[msg.sender] = _debtAmount + fee;
        status[msg.sender] = 1;

        // Mint MUSD to borrower (minus fee)
        MockMUSD(address(musd)).mint(msg.sender, _debtAmount - fee);
    }

    function closeTrove() external {
        require(status[msg.sender] == 1, "MockBO: no active trove");
        uint256 debtOwed = debt[msg.sender];
        require(musd.allowance(msg.sender, address(this)) >= debtOwed, "MockBO: insufficient allowance");
        musd.transferFrom(msg.sender, address(this), debtOwed);

        uint256 collToReturn = collateral[msg.sender];
        collateral[msg.sender] = 0;
        debt[msg.sender] = 0;
        status[msg.sender] = 2;

        (bool ok, ) = msg.sender.call{value: collToReturn}("");
        require(ok, "MockBO: BTC return failed");
    }

    function addColl(address, address) external payable {
        require(status[msg.sender] == 1, "MockBO: no active trove");
        collateral[msg.sender] += msg.value;
    }

    function withdrawColl(uint256 _amount, address, address) external {
        require(status[msg.sender] == 1, "MockBO: no active trove");
        require(collateral[msg.sender] >= _amount, "MockBO: insufficient coll");
        collateral[msg.sender] -= _amount;
        (bool ok, ) = msg.sender.call{value: _amount}("");
        require(ok, "MockBO: BTC transfer failed");
    }

    function withdrawMUSD(uint256 _amount, address, address) external {
        require(status[msg.sender] == 1, "MockBO: no active trove");
        uint256 fee = (_amount * BORROWING_RATE) / 1e18;
        debt[msg.sender] += _amount + fee;
        MockMUSD(address(musd)).mint(msg.sender, _amount - fee);
    }

    function repayMUSD(uint256 _amount, address, address) external {
        require(status[msg.sender] == 1, "MockBO: no active trove");
        require(musd.allowance(msg.sender, address(this)) >= _amount, "MockBO: allowance");
        musd.transferFrom(msg.sender, address(this), _amount);
        debt[msg.sender] = debt[msg.sender] > _amount ? debt[msg.sender] - _amount : 0;
    }

    function adjustTrove(uint256 _collWithdrawal, uint256 _debtChange, bool _isDebtIncrease, address, address) external payable {
        require(status[msg.sender] == 1, "MockBO: no active trove");
        collateral[msg.sender] += msg.value;
        if (_collWithdrawal > 0) {
            collateral[msg.sender] -= _collWithdrawal;
        }
        if (_isDebtIncrease) {
            debt[msg.sender] += _debtChange;
        } else {
            debt[msg.sender] = debt[msg.sender] > _debtChange ? debt[msg.sender] - _debtChange : 0;
        }
    }

    function getBorrowingFee(uint256 _debt) external pure returns (uint256) {
        return (_debt * BORROWING_RATE) / 1e18;
    }

    function minNetDebt() external pure returns (uint256) {
        return MIN_NET_DEBT;
    }

    function borrowingRate() external pure returns (uint256) {
        return BORROWING_RATE;
    }

    receive() external payable {}
}

interface MockMUSD {
    function mint(address to, uint256 amount) external;
}
