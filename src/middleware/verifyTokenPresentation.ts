// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

// https://stackoverflow.com/questions/53256724/cant-validate-token-in-middleware-jwt-express
import {
    CoreDID,
    EdDSAJwsVerifier,
    FailFast,
    IotaIdentityClient,
    JwsVerificationOptions,
    Jwt,
    JwtCredentialValidationOptions,
    JwtCredentialValidator,
    JwtPresentationValidationOptions,
    JwtPresentationValidator,
    Resolver,
    SubjectHolderRelationship,
} from "@iota/identity-wasm/node";
import { Request, Response, NextFunction } from "express";
import ChallengeService from "../services/challengesService";
// import { Client } from "@iota/sdk-wasm/node/lib/client/client";
import { Client } from "@iota/sdk-wasm/node/lib/client";
// import { Client } from "@iota/sdk-wasm/node";

async function verifyTokenPresentation (req: Request, res: Response, next: NextFunction) {
    const bearer = req.body.token || req.query.token || req.headers.authorization || req.headers['x-access-token'];
    console.log("presentation jwt: ", bearer.split(" ")[1]);
    const jwtString = bearer.split(" ")[1];
    const presentationJwt = new Jwt(jwtString);
    if (presentationJwt) {
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
                primaryNode: process.env.IOTA_NODE_URL,
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
            
            const challenge = await ChallengeService.getChallengeByDid(presentationHolderDID.toString());

            if ( challenge === null ) {
                throw new Error("expected to have a challenge");
            }

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

            // Validate the credentials in the presentation.
            for (let i = 0; i < jwtCredentials.length; i++) {
                credentialValidator.validate(
                    jwtCredentials[i],
                    resolvedIssuers[i],
                    validationOptions,
                    FailFast.FirstError,
                );
            }

            // Since no errors were thrown we know that the validation was successful.
            console.log(`VP successfully validated`);
            next();
        } catch (err) {
            return res.status(403).send({ 
                success: false, 
                message: 'Failed to authenticate.' 
            });
        }

    } else {
        return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
        });
    }
}

export default verifyTokenPresentation;




