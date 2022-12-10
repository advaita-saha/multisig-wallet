const main = async () => {
  const MultisigWalletFactory = await hre.ethers.getContractFactory(
    "MultiSigWallet"
  );
  const MultisigWallet = await MultisigWalletFactory.deploy([
    "0xb038ed8D57Bd6d9D758a86aa2AEcc6293CA49Cf1",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0xF8FD64b9E74076FC2833c7de85fac6204390FA4A",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  ]);
  await MultisigWallet.deployed();

  const AccessRegistryFactory = await hre.ethers.getContractFactory(
    "AccessControlWallet"
  );
  const AccessRegistry = await AccessRegistryFactory.deploy(
    MultisigWallet.address,
    [
      "0xb038ed8D57Bd6d9D758a86aa2AEcc6293CA49Cf1",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0xF8FD64b9E74076FC2833c7de85fac6204390FA4A",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    ]
  );
  await AccessRegistry.deployed();

  console.log(
    "Multisig Wallet:",
    MultisigWallet.address
  );

  console.log(
    "Access Registry:",
    AccessRegistry.address
  );
};

(async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();