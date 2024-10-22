// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const EXPIRES_IN_MILLISECONDS = 60000; //1 minute
const prisma = new PrismaClient();

/*
    Create and store in the db a new challenge
*/
async function addChallenge(userDid: string){
    const nonce = randomUUID().toString();
    const expiresAt = Date.now() + EXPIRES_IN_MILLISECONDS;

    const challenge = await prisma.challenges.create({data: {
        nonce: nonce,
        requester_did: userDid,
        expiration: expiresAt
    }});

    return challenge;
}

/*
    Search a valid challenge into the database.
    Valid challenge requirements:
    1. Challenge exists
    2. Challenge is assigned to the userDID
    3. Challenge is not expired
*/
async function getChallengeByDid (userDid: string, challenge: string){
    let validChallenge = await prisma.challenges.findUnique({where: {
        requester_did: userDid,
        nonce: challenge,
        expiration: { gt: Date.now() }
    }});
    return validChallenge;
}

async function removeChallenge (challenge: string){
    let deleted = await prisma.challenges.delete({where: {nonce: challenge}});
    return deleted;
}

/* Remove all the expired challenges */
// TODO: delete once every hour
async function cleanup() {
    let deleted = await prisma.challenges.deleteMany({where: {
        expiration: { lt: Date.now() }
    }})

    console.log("CLEAN UP DATABASE deleted %d records", deleted.count)
}

const ChallengeService = { addChallenge, getChallengeByDid, removeChallenge, cleanup };
export default ChallengeService;