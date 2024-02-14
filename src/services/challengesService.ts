// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import db, {challenges} from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { Duration, Timestamp } from '@iota/identity-wasm/node/identity_wasm';

async function addChallenge (userDid: string) {

    const pendingChallenge = await getChallengeByDid(userDid);
    console.log(pendingChallenge);
    if ( pendingChallenge != null && Timestamp.parse(pendingChallenge.expiration) > Timestamp.nowUTC() ){
        throw new Error("Requester has still a valid request pending. Please proceed with the second step.");
    } else if ( pendingChallenge != null ) { 
        await removeChallenge(userDid);
    }

    const nonce = uuidv4();
    const newExpiration = Timestamp.nowUTC().checkedAdd(Duration.minutes(10));

    if ( newExpiration === undefined ) {
        throw new Error("Problem while computing the expiration timestamp");
    }

    const challenge = await challenges(db).insert( 
        { expiration: newExpiration.toRFC3339(), requester_did:  userDid, nonce}    
    );
    console.log(challenge);
    return challenge;
}

async function getChallengeByNonce (nonce: string) {
    return await challenges(db).findOne({nonce});
}

async function getChallengeByDid (userDid: string) {
    return await challenges(db).findOne({requester_did: userDid});
}

async function removeChallenge (userDid: string) {
    await challenges(db).delete({requester_did: userDid});
}

const ChallengeService = { addChallenge, getChallengeByDid, getChallengeByNonce, removeChallenge };
export default ChallengeService;