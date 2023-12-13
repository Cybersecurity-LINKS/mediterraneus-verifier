import Router from 'express';
import ChallengeController from './controllers/challenges';

const router = Router();

router.get("/challenges", ChallengeController.getChallenge); 

export default router;