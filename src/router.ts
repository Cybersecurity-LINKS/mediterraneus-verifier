import Router from 'express';

const router = Router();

router.get("/challenge", (req, res) => { res.send('Hello World!') }); 

export default router;