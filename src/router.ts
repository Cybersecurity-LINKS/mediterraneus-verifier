// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import Router from 'express';
import ChallengeController from './controllers/challenges';
import verifyTokenPresentation from './middleware/verifyTokenPresentation';
import ChallengeService from './services/sqliteChallengeService';


const router = Router();
// removing expired challenges
ChallengeService.cleanup()

router.get("/challenges/:did", ChallengeController.validateDID, ChallengeController.getChallenge); 

// example of authn req
router.get("/verify/vp", verifyTokenPresentation, (req, res) => {
    
    res.status(200).json({
        "status": "success",
        "message": "ok"
    });
}); 


export default router;