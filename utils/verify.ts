import hre from "hardhat"

export const VerifyContract = async (address : string) => {

    console.log("Verifying contract...")
    try {
        await hre.run('verify:verify', {
            address : address,
            contract : "contracts/Gentlemen.sol:Gentlemen",
        })
    } catch (e) {
        if (
            e instanceof Error &&
            e.message.toLowerCase().includes("already verified")
        ) {
            console.log("Already verified!")
        } else {
            console.log(e)
        }
    }



}