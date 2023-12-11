CREATE TABLE challenges (
  	nonce 				UUID PRIMARY KEY,
    requester_did 		TEXT NOT NULL,
    expiration			TEXT NOT NULL
);