const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

let wallet;
let accounts;
let accessWallet;


beforeEach( async () => {
    accounts = await ethers.getSigners();
    const MultisigWallet = await ethers.getContractFactory("MultiSigWallet");
    wallet = await MultisigWallet.deploy([
      accounts[0].address,
      accounts[1].address,
      accounts[2].address,
      accounts[3].address
    ]);
    await wallet.deployed();

    await accounts[0].sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("100.0")
    });

    const AccessWalletFactory = await ethers.getContractFactory("AccessControlWallet");
    accessWallet = await AccessWalletFactory.deploy(wallet.address, [
        accounts[0].address,
        accounts[1].address,
        accounts[2].address,
        accounts[3].address
    ]);
    await accessWallet.deployed();
} );

describe("Access Wallet Tests", () => {

    it("should add owners to wallet", async () => {
        let ownersInitial = accessWallet.getOwners();
        await accessWallet.addOwner(accounts[5].address);

        let ownersFinal = accessWallet.getOwners();
        assert(ownersFinal, ownersInitial + 1, "New owners weren't added successfully");
    });

    it("should NOT add owners to wallet if call is not approved", async () => {
        await expect(
            accessWallet.connect(accounts[6]).addOwner(accounts[7].address)
        ).to.be.revertedWith("Admin restricted function");
    });

    it("should remove owners from wallet", async () => {
        let ownersInitial = await accessWallet.getOwners();
        await accessWallet.removeOwner(accounts[0].address);

        let ownersFinal = await accessWallet.getOwners();
        assert(ownersFinal, ownersInitial - 1, "Owners weren't removed successfully");
    });

    it("should NOT remove owners from wallet if call is not approved", async () => {
        await expect(
            accessWallet.connect(accounts[6]).removeOwner(accounts[0].address)
        ).to.be.revertedWith("Admin restricted function");
    });

    it("should transfer admin role to another account", async () => {
        await accessWallet.renounceAdmin(accounts[1].address);
        let final_admin = await accessWallet.getAdmin();

        assert(final_admin, accounts[1], "Admin transfer was unsuccessful");
    });

    it("should transfer ownership", async () => {
        let transfer = await accessWallet.transferOwner(accounts[1].address, accounts[5].address);
        let receipt = await transfer.wait();
        let data = receipt.events[1].args;
        expect(data.owner).to.equal(accounts[5].address);
    });
});
