import { ethers } from "hardhat";
import { VerifyContract } from "../utils/verify";

async function main() {
  const Gentelmen = await ethers.getContractFactory("Gentlemen");
  const gentelmen = await Gentelmen.deploy();

  await gentelmen.deployed();

  console.log(`
    DEPLOYED TO ${gentelmen.address}
  `);

  await VerifyContract(
    gentelmen.address,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
