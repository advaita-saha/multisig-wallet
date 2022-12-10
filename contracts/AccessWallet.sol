// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./InterfaceWallet.sol";
import "./CustomAccessControl.sol";

contract AccessControlWallet is CustomAccessControl {
    using SafeMath for uint256;

    IWallet _walletInterface;

    constructor(IWallet wallet_, address[] memory _owners) CustomAccessControl(_owners){
        _walletInterface = IWallet(wallet_);
        admin = msg.sender;
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getAdmin() external view returns (address) {
        return admin;
    }
}