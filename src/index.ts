import express from 'express';
import router from './router.js';
import morgan from 'morgan';

const port = parseInt(process.env.PORT || '1234');
const app = express();

app.use(morgan("dev"));
app.use(express.json())
app.use((_, res, next) => {
    res.append('Access-Control-Allow-Origin', [`${process.env.FRONTEND}`]); // FRONTEND
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

app.use('/', router);

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
