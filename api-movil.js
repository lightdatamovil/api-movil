import express, { json, urlencoded } from 'express';
import accounts from './routes/accounts.js';
import auth from './routes/auth.js';
import shipments from './routes/shipments.js';
import qr from './routes/qr.js';
import home from './routes/home.js';
import users from './routes/users.js';
import map from './routes/map.js';
import settlements from './routes/settlements.js';
import registerVisitRoute from './routes/registerVisit.js';
import collect from './routes/collect.js';
import { jwtSecret, redisClient } from './db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { logBlue, logRed, Status, verifyToken } from 'lightdata-tools';

dotenv.config({ path: process.env.ENV_FILE || ".env" });

const PORT = process.env.PORT;

const app = express();

app.use(json({ limit: '50mb' }));
app.use(urlencoded({ limit: '50mb', extended: true }));
app.use(json());
app.use(cors());

app.get('/ping', (req, res) => {
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours());

    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    const formattedTime = `${hours}:${minutes}:${seconds}`;

    res.status(Status.ok).json({ hora: formattedTime });
});

(async () => {
    try {
        await redisClient.connect();

        app.use('/api/auth', auth);
        app.use(verifyToken(jwtSecret));
        app.use('/api/accounts', accounts);
        app.use('/api/shipments', shipments);
        app.use('/api/settlements', settlements);
        app.use('/api/qr', qr);
        app.use('/api/home', home);
        app.use('/api/users', users);
        app.use('/api/map', map);
        app.use("/api/collect", collect)
        app.use("/api/register-visit", registerVisitRoute);

        app.listen(PORT, '0.0.0.0', () => {
            logBlue(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
        });
    } catch (err) {
        logRed(`Error al iniciar el servidor: ${err}`);
    }
})();

