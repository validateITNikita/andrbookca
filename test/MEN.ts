import { expect } from "chai";
import { ethers } from "hardhat";
import { beforeEach } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Mint Gentlemen", function () {
    let gentelmen: any;
    let owner: SignerWithAddress;
    let otherAccount: SignerWithAddress;
    let zeroAccount: SignerWithAddress;
    let recipientAccount: SignerWithAddress;
    let usdt: any;

    beforeEach(async () => {
        const [deployer, other, zero, recipient] = await ethers.getSigners();
        owner = deployer;
        otherAccount = other;
        zeroAccount = zero;
        recipientAccount = recipient;

        // DEPLOY USDT TESTNET
        const USDT = await ethers.getContractFactory("USDTTEST");
        usdt = await USDT.deploy();

        // MINT USDT TESTNET
        let ownerUSDT = usdt.connect(owner);

        await ownerUSDT.mint(owner.address, ethers.utils.parseEther("1000"));
        await ownerUSDT.mint(
            otherAccount.address,
            ethers.utils.parseEther("2")
        );

        // DEPLOY GNTLM TESTNET
        const GNTLM = await ethers.getContractFactory("Gentlemen");
        gentelmen = await GNTLM.deploy();

        let GNT = gentelmen.connect(owner);

        // Set recipients of USDT when someone mints
        await GNT.changeRecipients(
            recipientAccount.address,
            otherAccount.address
        );

        // SET USDT TESTNET address
        GNT.setUSDTAddress(usdt.address);

        // Approve contract to spend USDT tokens
        let amount = ethers.utils.parseEther("1000000000");
        await ownerUSDT.approve(gentelmen.address, amount);
        await ownerUSDT.approve(owner.address, amount);
    });

    describe("Deployment", () => {
        it("Should be deployed without an error!", async function () {
            expect(gentelmen.address != undefined);
        });

        it("Should set the right owner!", async function () {
            expect(await gentelmen.owner()).to.equal(owner.address);
        });

        it("Should have the correct token name and symbol", async function () {
            expect(await gentelmen.name()).to.equal("Gentelmen");
            expect(await gentelmen.symbol()).to.equal("MEN");
        });
    });

    describe("USDT", () => {
        it("Owner and other account addresses should have USDT", async () => {
            expect(Number(usdt.balanceOf(owner.address)) > 0);
            expect(Number(usdt.balanceOf(otherAccount.address)) > 0);

            console.log(`
          USDT BALANCES:
            OWNER: ${ethers.utils.formatEther(
                await usdt.balanceOf(owner.address)
            )}

            OTHER: ${ethers.utils.formatEther(
                await usdt.balanceOf(otherAccount.address)
            )}
      `);
        });
    });

    describe("Minting", () => {
        it("Should not be able to mint!", async function () {
            gentelmen.connect(otherAccount);

            await expect(gentelmen.safeMint("w")).to.be.revertedWith(
                "Minting is not enabled."
            );
        });

        it("It should mint.", async () => {
            let ownerGNTL = gentelmen.connect(owner);

            // Enable minting
            await ownerGNTL.toggleMinting(true);

            await ownerGNTL.safeMint("uri1");

            // Verify the token owner
            expect(await gentelmen.ownerOf(0)).to.equal(owner.address);
        });

        it("Should prevent minting when the max supply is reached", async function () {
            // Set max supply to 1
            gentelmen.connect(owner);
            await gentelmen.setMaxSupply(1);

            // Enable minting
            await gentelmen.toggleMinting(true);

            // Mint the first token
            await gentelmen.safeMint("tokenURI1");

            // Attempt to mint the second token
            await expect(gentelmen.safeMint("tokenURI2")).to.be.revertedWith(
                "Sold out!"
            );
        });

        it("Should send USDT to both addresses!", async () => {
            let ownerGNT = gentelmen.connect(owner);

            // Enable minting
            await ownerGNT.toggleMinting(true);

            const balanceBefore = ethers.utils.formatEther(
                await usdt.balanceOf(recipientAccount.address)
            );

            console.log(`
              BALANCES BEFORE:
                OWNER: ${ethers.utils.formatEther(
                    await usdt.balanceOf(owner.address)
                )}

                OTHER: ${ethers.utils.formatEther(
                    await usdt.balanceOf(otherAccount.address)
                )}

                CONTRACT: ${ethers.utils.formatEther(
                    await usdt.balanceOf(gentelmen.address)
                )}

                RECIPIENT: ${ethers.utils.formatEther(
                    await usdt.balanceOf(recipientAccount.address)
                )}
            `);
            let ownerUSDT = usdt.connect(owner);
            ownerUSDT.approve(ownerGNT.address, ethers.utils.parseEther("13"));

            await ownerGNT.safeMint("uri1");

            const BalanceAfter = ethers.utils.formatEther(
                await usdt.balanceOf(recipientAccount.address)
            );
            console.log(`
              BALANCES AFTER:
                OWNER: ${ethers.utils.formatEther(
                    await usdt.balanceOf(owner.address)
                )}

                OTHER: ${ethers.utils.formatEther(
                    await usdt.balanceOf(otherAccount.address)
                )}

                CONTRACT: ${ethers.utils.formatEther(
                    await usdt.balanceOf(gentelmen.address)
                )}

                RECIPIENT: ${ethers.utils.formatEther(
                    await usdt.balanceOf(recipientAccount.address)
                )}
            `);
            expect(Number(BalanceAfter)).to.be.greaterThan(
                Number(balanceBefore)
            );
        });

        it("Should prevent minting when sender does not have enough USDT", async function () {
            gentelmen.connect(owner);

            // Enable minting
            await gentelmen.toggleMinting(true);

            let _gent = gentelmen.connect(zeroAccount);
            // Attempt to mint a token with insufficient USDT balance
            await expect(_gent.safeMint("tokenURI")).to.be.revertedWith(
                "Not enough funds. Add more USDT!"
            );
        });
    });

    describe("Withdraw", () => {
        it("Should prevent non-owners from withdrawing USDT", async () => {
            const gntl = gentelmen.connect(otherAccount);
            await expect(gntl.withdrawUSDT()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Should prevent non-owners from withdrawing", async () => {
            const gntl = gentelmen.connect(otherAccount);
            await expect(gntl.withdraw()).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });
    });
});
