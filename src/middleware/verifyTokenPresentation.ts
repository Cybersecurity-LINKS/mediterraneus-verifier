// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

// https://stackoverflow.com/questions/53256724/cant-validate-token-in-middleware-jwt-express
import {
    CoreDID,
    CoreDocument,
    EdDSAJwsVerifier,
    FailFast,
    IotaIdentityClient,
    JwsVerificationOptions,
    Jwt,
    JwtCredentialValidationOptions,
    JwtCredentialValidator,
    JwtPresentationValidationOptions,
    JwtPresentationValidator,
    MethodData,
    Resolver,
    SubjectHolderRelationship,
} from "@iota/identity-wasm/node";
import { Request, Response, NextFunction } from "express";
import ChallengeService from "../services/sqliteChallengeService";
import { Client } from "@iota/sdk-wasm/node/lib/client";

function getNonceFromJwtHeader(token: String){
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT token');
    }

    // Decode the header
    const headerBase64Url = parts[0];
    const headerJson = Buffer.from(headerBase64Url, 'base64url').toString('utf-8');
    const headerObject = JSON.parse(headerJson);
    return headerObject.nonce;
}

async function verifyTokenPresentation (req: Request, res: Response, next: NextFunction) {
    const bearer = req.body.token || req.query.token || req.headers.authorization || req.headers['x-access-token'];
    const jwtString = bearer;
    const presentationJwt = new Jwt(jwtString);
    if (presentationJwt) {
        const json = presentationJwt.toJSON();
        console.log({json});
        // ===========================================================================
        // Step 7: Verifier receives the Verifiable Presentation and verifies it.
        // ===========================================================================

        // The verifier wants the following requirements to be satisfied:
        // - JWT verification of the presentation (including checking the requested challenge to mitigate replay attacks)
        // - JWT verification of the credentials.
        // - The presentation holder must always be the subject, regardless of the presence of the nonTransferable property
        // - The issuance date must not be in the future.

        try {
            
            const client = new Client({
                primaryNode: process.env.NODE_URL,
                localPow: true,
            });
            const didClient = new IotaIdentityClient(client);

            const resolver = new Resolver({
                client: didClient,
            });

            // Resolve the presentation holder.
            const presentationHolderDID: CoreDID = JwtPresentationValidator.extractHolder(presentationJwt);
            const resolvedHolder = await resolver.resolve(
                presentationHolderDID.toString(),
            );
            
            const nonce = getNonceFromJwtHeader(jwtString);
            const challenge = await ChallengeService.getChallengeByDid(presentationHolderDID.toString(), nonce);

            if ( challenge === null ) {
                throw new Error("expected to have a challenge");
            }

            // Add nonce to middleware result
            res.locals.nonce = challenge.nonce;

            const jwtPresentationValidationOptions = new JwtPresentationValidationOptions(
                {
                    presentationVerifierOptions: new JwsVerificationOptions({ nonce: challenge.nonce }),
                },
            );

            // Validate presentation. Note that this doesn't validate the included credentials.
            const decodedPresentation = new JwtPresentationValidator(new EdDSAJwsVerifier()).validate(
                presentationJwt,
                resolvedHolder,
                jwtPresentationValidationOptions,
            );

            // extract the wallet address from holder's DID document
            const methodData = (resolvedHolder as CoreDocument).resolveMethod("#ethAddress")
                ?.data().tryCustom().toJSON() as any;

            if (methodData.name == "blockchainAccountId")
            {
                const address = (methodData.data as string).replace("eip155:1:", "");
                res.locals.walletAddress = address;
            }

            // Extract signature from the VP
            const walletSignature = decodedPresentation.customClaims()?.["walletSignature"];
            res.locals.walletSignature = walletSignature;

            // Validate the credentials in the presentation.
            const credentialValidator = new JwtCredentialValidator(new EdDSAJwsVerifier());
            const validationOptions = new JwtCredentialValidationOptions({
                subjectHolderRelationship: [
                    presentationHolderDID.toString(),
                    SubjectHolderRelationship.AlwaysSubject,
                ],
            });

            const jwtCredentials: Jwt[] = decodedPresentation
                .presentation()
                .verifiableCredential()
                .map((credential) => {
                    const jwt = credential.tryIntoJwt();
                    if (!jwt) {
                        throw new Error("expected a JWT credential");
                    } else {
                        return jwt;
                    }
                });

            // Concurrently resolve the issuers' documents.
            const issuers: string[] = [];
            for (const jwtCredential of jwtCredentials) {
                const issuer = JwtCredentialValidator.extractIssuerFromJwt(jwtCredential);
                issuers.push(issuer.toString());
            }
            const resolvedIssuers = await resolver.resolveMultiple(issuers);

            let decodedCredentials = [];
            // Validate the credentials in the presentation.
            for (let i = 0; i < jwtCredentials.length; i++) {
                const decoded = credentialValidator.validate(
                    jwtCredentials[i],
                    resolvedIssuers[i],
                    validationOptions,
                    FailFast.FirstError,
                );
                decodedCredentials.push(decoded)
            }

            // The credential must contains a single Marketplace credential
            let valid_credential = decodedCredentials
                .filter((cred) => cred.credential().type().includes("MarketplaceCredential"))
                .length;
            
            if (valid_credential != 1){
                return res.status(403).send({ 
                    status: "error", 
                    message: 'Credentials are not valid.' 
                });
            }
            // Since no errors were thrown we know that the validation was successful.
            console.log(`VP successfully validated`);
            // verification completed, removing the challenge
            ChallengeService.removeChallenge(nonce);
            next();
        } catch (err) {
            console.log(err);
            return res.status(403).send({ 
                status: "error", 
                message: 'Failed to validate.' 
            });
        }

    } else {
        return res.status(403).json({ 
        status: "error", 
        message: 'No token provided.' 
        });
    }
}

export default verifyTokenPresentation;




