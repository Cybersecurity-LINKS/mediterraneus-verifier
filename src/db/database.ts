// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import createConnectionPool, {sql} from '@databases/pg';
import tables from '@databases/pg-typed';
import DatabaseSchema from './__generated__';
import schemajson from './__generated__/schema.json' assert {type: "json"};

export {sql};

const connectionString =  `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.POSTGRES_DB}`;
console.log("Connection string:", connectionString);

const db = createConnectionPool({
  connectionString: connectionString,
  maxUses:  parseInt(process.env.PG_POOL_MAX_SIZE || '16'),
  idleTimeoutMilliseconds: 30000,
  bigIntMode: "bigint"
});
export default db;

// You can list whatever tables you actually have here:
const {challenges} = tables<DatabaseSchema>({
  databaseSchema: schemajson,
});
export {challenges};