import { ethers } from "hardhat"

// Mezo Matsnet Testnet Contract Addresses
const BORROWER_OPERATIONS = "0xCdF7028ceAB81fA0C6971208e83fa7872994beE5"
const TROVE_MANAGER       = "0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0"
const PRICE_FEED          = "0x86bCF0841622a5dAC14A313a15f96A95421b9366"
const MUSD                = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503"

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying BitBankRouter with account:", deployer.address)

  const BitBankRouter = await ethers.getContractFactory("BitBankRouter")
  const router = await BitBankRouter.deploy(
    BORROWER_OPERATIONS,
    TROVE_MANAGER,
    PRICE_FEED,
    MUSD
  )
  await router.waitForDeployment()
  const routerAddress = await router.getAddress()

  console.log("\n=== Deployment Summary ===")
  console.log("Network:            Mezo Matsnet Testnet (31611)")
  console.log("BitBankRouter:      ", routerAddress)
  console.log("BorrowerOperations: ", BORROWER_OPERATIONS)
  console.log("TroveManager:       ", TROVE_MANAGER)
  console.log("PriceFeed:          ", PRICE_FEED)
  console.log("MUSD:               ", MUSD)
  console.log("\nVerify:")
  console.log(`npx hardhat verify --network matsnet ${routerAddress} ${BORROWER_OPERATIONS} ${TROVE_MANAGER} ${PRICE_FEED} ${MUSD}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
