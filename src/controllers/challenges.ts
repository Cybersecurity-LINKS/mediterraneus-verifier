// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later


import { NextFunction, Request, Response } from 'express';
import ChallengeService from '../services/sqliteChallengeService.js'; 
import { CoreDID } from '@iota/identity-wasm/node/index.js';

// generate a nonce and return the challenge
async function getChallenge(req: Request, res: Response) {
    const userDid = req.params.did as string;
    try {         
        const challenge = await ChallengeService.addChallenge(userDid);
        res.status(200).send(challenge).end();
    } catch (error) {
        console.log(error);
        res.status(500).send(error).end();
    }
}

// check if the value received as a parameter is a valid did
async function validateDID(req: Request, res: Response, next: NextFunction) {
    const did = req.params.did as string;

    // if the parsing doesn't throw an error than the did is validated
    try{
        let parsed = CoreDID.parse(did);
        next();
    }
    catch{
        res
        .status(422)
        .json({
            "status": "error",
            "message": "Request parameter is not a valid DID"
        })
    }
}

const ChallengeController = { getChallenge, validateDID };
export default ChallengeController;