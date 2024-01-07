import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from 'dotenv';
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks : {
    bsc : {
      chainId : 56,
      url : "https://bsc.publicnode.com",
      accounts : [process.env.PRIVATE_KEY as string]
    },
    bsctest : {
      chainId : 97,
      url : 'https://bsc-testnet.publicnode.com',
      accounts : [process.env.PRIVATE_KEY as string]
    }
  },
  etherscan : {
    apiKey : process.env.SCANNER_API as string
  },
};

export default config;
