// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./InterfaceWallet.sol";
import "./CustomAccessControl.sol";


contract MultiSigWallet is CustomAccessControl {
    using SafeMath for uint256;

    struct Transaction {
        bool executed;
        address destination;
        uint256 value;
        bytes data;
    }

    uint256 public transactionCount;
    mapping(uint256 => Transaction) public transactions;
    Transaction[] public _validTransactions;

    mapping(uint256 => mapping(address => bool)) public confirmations;

    fallback() external payable {
        if (msg.value > 0) {
            emit Deposit(msg.sender, msg.value);
        }
    }

    receive() external payable {
        if (msg.value > 0) {
            emit Deposit(msg.sender, msg.value);
        }
    }

    modifier isOwnerMod(address owner) {
        require(
            isOwner[owner] == true,
            "You are not authorized for this action."
        );
        _;
    }

    modifier isConfirmedMod(uint256 transactionId, address owner) {
        require(
            confirmations[transactionId][owner] == false,
            "You have already confirmed this transaction."
        );
        _;
    }

    modifier isExecutedMod(uint256 transactionId) {
        require(
            transactions[transactionId].executed == false,
            "This transaction has already been executed."
        );
        _;
    }

    constructor(address[] memory _owners) CustomAccessControl(_owners) {}


    function submitTransaction(
        address destination,
        uint256 value,
        bytes memory data
    ) public isOwnerMod(msg.sender) returns (uint256 transactionId) {

        transactionId = transactionCount;

        transactions[transactionId] = Transaction({
            destination: destination,
            value: value,
            data: data,
            executed: false
        });

        transactionCount += 1;

        emit Submission(transactionId);

        confirmTransaction(transactionId);
    }

    function confirmTransaction(uint256 transactionId)
        public
        isOwnerMod(msg.sender)
        isConfirmedMod(transactionId, msg.sender)
        notNull(transactions[transactionId].destination)
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);

        executeTransaction(transactionId);
    }

    function executeTransaction(uint256 transactionId)
        public
        isOwnerMod(msg.sender)
        isExecutedMod(transactionId)
    {
        uint256 count = 0;
        bool quorumReached;

        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) count += 1;
            if (count >= quorum) quorumReached = true;
        }

        if (quorumReached) {

            Transaction storage txn = transactions[transactionId];
            txn.executed = true;
            (bool success, ) = txn.destination.call{value: txn.value}(txn.data);

            if (success) {
                _validTransactions.push(txn);
                emit Execution(transactionId);
            } else {
                emit ExecutionFailure(transactionId);
                txn.executed = false;
            }
        }
    }

    function revokeTransaction(uint256 transactionId)
        external
        isOwnerMod(msg.sender)
        isConfirmedMod(transactionId, msg.sender)
        isExecutedMod(transactionId)
        notNull(transactions[transactionId].destination)
    {
        confirmations[transactionId][msg.sender] = false;
        emit Revocation(msg.sender, transactionId);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getValidTransactions()
        external
        view
        returns (Transaction[] memory)
    {
        return _validTransactions;
    }

    function getQuorum() external view returns (uint256) {
        return quorum;
    }
}