// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'
import { randomUUID } from "crypto";

interface Challenge{
    nonce: string,
    requester_did: string,
    expiration: number
}

const EXPIRES_IN_MILLISECONDS = 60000; //1 minute

async function openCached(){
    return open({
        filename: `${process.env.DATABASE_URL}`,
        driver: sqlite3.cached.Database
    })
}

async function init() {
    await openCached()
    .then(
        db => db.exec(`CREATE TABLE IF NOT EXISTS challenges (
    nonce 				    UUID PRIMARY KEY,
    requester_did 		TEXT NOT NULL,
    expiration			  NUMERIC NOT NULL
    );`)
    )

    console.log("Table created");

    return;
}

/*
    Create and store in the db a new challenge
*/
async function addChallenge(userDid: string){
    const nonce = randomUUID().toString();
    const expiresAt = Date.now() + EXPIRES_IN_MILLISECONDS;

    const challenge = await openCached()
        .then(db => {
            return db.get<Challenge>(`INSERT INTO challenges(nonce, requester_did, expiration) 
                VALUES (?, ?, ?) 
                RETURNING *;`, [nonce, userDid, expiresAt]);
        });

    console.log(challenge);
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
    let validChallenge = await openCached()
        .then(db => {
            return db.get<Challenge>(`SELECT * FROM challenges 
                WHERE requester_did = '?'
                AND nonce = '?'
                `, [userDid, challenge]);
        });

    return validChallenge;
}

async function removeChallenge (challenge: string){
    await openCached()
    .then(db => db.run(`DELETE FROM challenges WHERE nonce = '?'`, [challenge]));
    return;
}

/* Remove all the expired challenges */
// TODO: delete once every hour
async function cleanup() {
    let deleted = await openCached()
        .then(db => db.run(`DELETE FROM challenges WHERE expiration < ?`, [Date.now()]));

    console.log("CLEAN UP DATABASE deleted %d records", deleted.changes)
}

const ChallengeService = { addChallenge, getChallengeByDid, removeChallenge, cleanup, init };
export default ChallengeService;