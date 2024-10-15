// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later


import { Request, Response } from 'express';
import ChallengeService from '../services/sqliteChallengeService'; 

async function getChallenge(req: Request, res: Response) {
    const userDid = req.params.did as string;
    try {         
        const challenge = await ChallengeService.addChallenge(userDid);
        res.status(200).send({challenge: challenge}).end();
    } catch (error) {
        console.log(error);
        res.status(500).send(error).end();
    }
}

const ChallengeController = { getChallenge };
export default ChallengeController;