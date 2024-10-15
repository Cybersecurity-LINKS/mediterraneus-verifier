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
    /* TODO: what to do if user already has a pending challenge? 
       Just don't care. The expiration will rule the validity of the challenge
    */

    const nonce = randomUUID().toString();
    const expiresAt = Date.now() + EXPIRES_IN_MILLISECONDS;

    // TODO: Add DID validation
    const challenge = await prisma.challenges.create({data: {
        nonce: nonce,
        requester_did: userDid,
        expiration: expiresAt
    }});

    return challenge;
}

async function getChallengeByNonce(nonce: string) {
    let challenge = await prisma.challenges.findUnique({
        where: {nonce: nonce}
    });

    return challenge;
}

async function getChallengeByDid (userDid: string){
    let challenge = await prisma.challenges.findFirst({where: {requester_did: userDid}});
    return challenge;
}

async function removeChallenge (userDid: string){
    let deleted = await prisma.challenges.deleteMany({where: {requester_did: userDid}});
    return deleted;
}

const ChallengeService = { addChallenge, getChallengeByDid, getChallengeByNonce, removeChallenge };
export default ChallengeService;