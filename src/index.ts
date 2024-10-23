// SPDX-FileCopyrightText: 2024 Fondazione LINKS
//
// SPDX-License-Identifier: GPL-3.0-or-later

import express from 'express';
import router from './router';
import morgan from 'morgan';

const port = parseInt(process.env.PORT || '1234');
const app = express();

app.use(morgan("dev"));
app.use(express.json())
app.use((_, res, next) => {
    res.append('Access-Control-Allow-Origin', [`${process.env.ALLOW_ORIGIN}`]);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE');
    res.append('Access-Control-Allow-Headers', '*');
    next();
})

app.use('/api', router);

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
