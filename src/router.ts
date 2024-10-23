// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Router from 'express';
import ChallengeController from './controllers/challenges';
import verifyTokenPresentation from './middleware/verifyTokenPresentation';
import ChallengeService from './services/sqliteChallengeService';


const router = Router();
// removing expired challenges
const CLEANUP_CYCLE_WAIT_MILLIS = 3600000 // 1 hour
setInterval(async () => {
    await ChallengeService.cleanup()
}, CLEANUP_CYCLE_WAIT_MILLIS);



router.get("/challenges/:did", ChallengeController.validateDID, ChallengeController.getChallenge); 

// example of authn req
router.post("/verify/vp", verifyTokenPresentation, (_, res) => {
    
    res.status(200).json({
        "status": "success",
        "message": "ok"
    });
}); 


export default router;