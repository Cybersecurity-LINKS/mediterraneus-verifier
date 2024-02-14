-- SPDX-FileCopyrightText: 2024 Fondazione LINKS

-- SPDX-License-Identifier: GPL-3.0-or-later

CREATE TABLE challenges (
  nonce 				    UUID PRIMARY KEY,
  requester_did 		TEXT NOT NULL,
  expiration			  TEXT NOT NULL
);