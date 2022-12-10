const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let contract;
let accounts;


beforeEach( async () => {
    accounts = await ethers.getSigners();
    const MultisigWallet = await ethers.getContractFactory("MultiSigWallet");
    contract = await MultisigWallet.deploy([
      accounts[0].address,
      accounts[1].address,
      accounts[2].address,
      accounts[3].address
    ]);
    await contract.deployed();

    await accounts[0].sendTransaction({
      to: contract.address,
      value: ethers.utils.parseEther("100.0")
    });

} );

describe("Multisig Wallet Tests", () => {

  it("Owner Check", async () => {
      const owners = await contract.getOwners();
      expect(owners).to.deep.equal([
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
        accounts[3].address
      ]);
  });

  it("submit transaction but not approve without others", async () => {
    const transactions_initial = await contract.getValidTransactions();
    assert(transactions_initial.length === 0);

    await contract.submitTransaction(accounts[5].address, 100, "0x00");

    const transactions = await contract.getValidTransactions();
    expect(transactions.length).to.equal(0);
  });

  it("should not create a transfer if sender is not one of the approvers", async () => {
    await expect(
      contract.connect(accounts[5]).submitTransaction(accounts[5].address, 100, "0x00")
    ).to.be.revertedWith("You are not authorized for this action.");
  });

  it("should send the transfer if quorum is reached", async () => {
    await contract.submitTransaction(accounts[5].address, 100, "0x00");
    await contract.connect(accounts[1]).confirmTransaction(0);
    let transactions = await contract.getValidTransactions();
    expect(transactions[0].executed).to.deep.equal(true);
  });

  it("should not approve the transfer if sender is not approved", async () => {
    await contract.submitTransaction(accounts[5].address, 100, "0x00");
    await expect(
      contract.connect(accounts[4]).confirmTransaction(0)
    ).to.be.revertedWith("You are not authorized for this action.");
  });
  
  it("should not approve the transfer if transfer is already has been sent", async () => {
    await contract.submitTransaction(accounts[5].address, 100, "0x00");
    await contract.connect(accounts[1]).confirmTransaction(0);
    await expect(
      contract.connect(accounts[2]).confirmTransaction(0),
    ).to.be.revertedWith("This transaction has already been executed.");
  });
});