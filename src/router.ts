import Router from 'express';
import ChallengeController from './controllers/challenges';
import verifyToken from './middleware/verifyToken';

const router = Router();

router.get("/challenges", ChallengeController.getChallenge); 

// example of authn req
router.get("/hello-world", verifyToken, (req, res) => {
    res.json('Hello World!')
}); 


export default router;