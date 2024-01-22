import Router from 'express';
import ChallengeController from './controllers/challenges';
import verifyTokenPresentation from './middleware/verifyTokenPresentation';

const router = Router();
// TODO: handle expiration
router.get("/challenges", ChallengeController.getChallenge); 

// example of authn req
router.get("/hello-world", verifyTokenPresentation, (req, res) => {
    res.json('Hello World!')
}); 


export default router;