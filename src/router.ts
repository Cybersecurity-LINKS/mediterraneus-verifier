// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Router from 'express';
import ChallengeController from './controllers/challenges.js';
import verifyTokenPresentation from './middleware/verifyTokenPresentation.js';
import ChallengeService from './services/sqliteChallengeService.js';
import ServiceBaseAbi from './contracts/ServiceBaseAbi.js';
import { ethers } from 'ethers';


const router = Router();
// Init the database
await ChallengeService.init();

// removing expired challenges
const CLEANUP_CYCLE_WAIT_MILLIS = 3600000 // 1 hour
setInterval(async () => {
    await ChallengeService.cleanup()
}, CLEANUP_CYCLE_WAIT_MILLIS);

const provider = new ethers.JsonRpcProvider(process.env.RPC_PROVIDER);


router.get("/challenges/:did", ChallengeController.validateDID, ChallengeController.getChallenge); 

// example of authn req
router.post("/verify/vp", verifyTokenPresentation, (_, res) => {
    
    res.status(200).json({
        "status": "success",
        "message": "ok"
    });
}); 

// Verify the proof of purchase for a given Service NFT
router.post("/verify/:nftAddress", verifyTokenPresentation, async (req, res) => {
    const nftAddress = req.params.nftAddress as string;
    // Read VP signature and nonce from VP middleware
    const signature = (res.locals.walletSignature as string);
    const challenge = res.locals.nonce;

    try {
        const signatureBytes = ethers.getBytes(signature);
        const challengeBytes = ethers.toUtf8Bytes(challenge);

        // retrieve SC
        let serviceBaseContract = new ethers.Contract(
            nftAddress,
            ServiceBaseAbi.abi,
            provider
        );

        // read AT address from the contract
        let verified = await serviceBaseContract.verifyProofOfPurchase(signatureBytes, challengeBytes);

        if (verified){
            return res
                .status(200)
                .send({
                    "status": "success",
                    "message": "Verified"
                });
        }
        else{
            return res
                .status(403)
                .send({
                    "status": "error",
                    "message": "User does not own a token"
                });
        }        
    } catch (error) {
        return res
            .status(500)
            .send({
                "status": "error",
                "message": "Cannot verify proof of purchase. Reason: " + error
            })
    }

});


export default router;