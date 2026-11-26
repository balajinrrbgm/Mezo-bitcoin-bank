import { expect } from 'chai'
import { ethers } from 'hardhat'
import { parseEther, parseUnits } from 'ethers'

describe('BitBankRouter', () => {
  async function deployFixture() {
    const [owner, alice, bob] = await ethers.getSigners()

    const MockERC20 = await ethers.getContractFactory('MockERC20')
    const musd = await MockERC20.deploy('Mezo USD', 'MUSD')

    const MockBO = await ethers.getContractFactory('MockBorrowerOperations')
    const bo = await MockBO.deploy(await musd.getAddress())

    const MockTM = await ethers.getContractFactory('MockTroveManager')
    const tm = await MockTM.deploy()

    const MockPF = await ethers.getContractFactory('MockPriceFeed')
    const pf = await MockPF.deploy()

    const Router = await ethers.getContractFactory('BitBankRouter')
    const router = await Router.deploy(
      await bo.getAddress(),
      await tm.getAddress(),
      await pf.getAddress(),  // priceFeed is 3rd arg
      await musd.getAddress() // musd is 4th arg
    )

    return { router, bo, tm, pf, musd, owner, alice, bob }
  }

  describe('Deployment', () => {
    it('deploys with correct references', async () => {
      const { router, bo, tm, musd, pf } = await deployFixture()
      expect(await router.borrowerOperations()).to.equal(await bo.getAddress())
      expect(await router.troveManager()).to.equal(await tm.getAddress())
      expect(await router.musd()).to.equal(await musd.getAddress())
      expect(await router.priceFeed()).to.equal(await pf.getAddress())
    })
  })

  describe('openPosition', () => {
    it('opens a position with BTC collateral', async () => {
      const { router, alice } = await deployFixture()
      const collateral = parseEther('0.1')   // 0.1 BTC
      const debt = parseUnits('2000', 18)    // 2000 MUSD

      // Open the position (MockBO will handle internally)
      await router.connect(alice).openPosition(debt, ethers.ZeroAddress, ethers.ZeroAddress, {
        value: collateral,
      })

      const snap = await router.snapshots(alice.address)
      expect(snap.openedAt).to.be.gt(0)
      expect(snap.totalBorrowed).to.equal(debt)
    })

    it('reverts with zero collateral', async () => {
      const { router, alice } = await deployFixture()
      await expect(
        router.connect(alice).openPosition(parseUnits('2000', 18), ethers.ZeroAddress, ethers.ZeroAddress, {
          value: 0,
        })
      ).to.be.revertedWithCustomError(router, 'InsufficientCollateral')
    })

    it('reverts with zero debt', async () => {
      const { router, alice } = await deployFixture()
      await expect(
        router.connect(alice).openPosition(0, ethers.ZeroAddress, ethers.ZeroAddress, {
          value: parseEther('0.1'),
        })
      ).to.be.revertedWithCustomError(router, 'ZeroAmount')
    })
  })

  describe('getPositionHealth', () => {
    it('returns health data for an active position', async () => {
      const { router, tm, alice } = await deployFixture()
      const coll = parseEther('0.1')
      const debt = parseUnits('2000', 18)
      // Pre-set mock trove state (without opening through router)
      await tm.setMockState(alice.address, coll, debt, 1)

      const result = await router.getPositionHealth(alice.address)
      const [retColl, retDebt, icr, status] = result

      expect(retColl).to.equal(coll)
      expect(retDebt).to.equal(debt)
      expect(icr).to.be.gt(0n)
      expect(status).to.equal(1) // active
    })
  })

  describe('protocolStats', () => {
    it('returns protocol-wide stats', async () => {
      const { router } = await deployFixture()
      const [totalColl, totalDebt, tcr, btcPrice, inRecovery] =
        await router.protocolStats()

      expect(btcPrice).to.equal(parseEther('60000'))
      expect(tcr).to.equal(200n * 10n ** 16n)
      expect(inRecovery).to.equal(false)
    })
  })

  describe('maxSafeDebt', () => {
    it('calculates max debt at target ICR', async () => {
      const { router } = await deployFixture()
      const coll = parseEther('0.1')        // 0.1 BTC
      const targetICR = 250n * 10n ** 16n   // 250%
      // At $60k BTC, 0.1 BTC = $6000
      // maxDebt = $6000 / 250% = $2400
      const maxDebt = await router.maxSafeDebt(coll, targetICR)
      expect(maxDebt).to.be.closeTo(parseUnits('2400', 18), parseUnits('10', 18))
    })
  })
})
