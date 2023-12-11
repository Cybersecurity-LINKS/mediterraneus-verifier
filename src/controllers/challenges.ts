//TODO: update
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { check_and_clean_ChallengeReq } from '../services/identity';
import { insertChallengeReq } from '../models/db-operations';
import { Duration, Timestamp } from '@iota/identity-wasm/node/identity_wasm';

async function getChallenge(req: Request, res: Response) {
    const eth_address = req.params.eth_address;
    try {
        if((await check_and_clean_ChallengeReq(eth_address))) {
            const challenge = uuidv4();
            const expires = Timestamp.nowUTC().checkedAdd(Duration.minutes(1));
            await insertChallengeReq(eth_address, challenge, expires);
            res.status(200).send({challenge: challenge}).end();
        } else {
            throw Error("Requester has still a valid request pending. Please proceed with the second step.")
        }
    } catch (error) {
        console.log(error);
        res.status(400).send(error).end();
    }
}

const ChallengeController = { getChallenge };
export default ChallengeController;