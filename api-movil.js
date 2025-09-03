import express, { json, urlencoded } from 'express';
import cluster from 'cluster';
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
import { redisClient } from './db.js';
import cors from 'cors';
import dotenv from 'dotenv';
import { logBlue, logRed } from 'lightdata-tools';


dotenv.config({ path: process.env.ENV_FILE || ".env" });



const numCPUs = 2;
const PORT = process.env.PORT;

// TODO: PROBAR HOME, NICIAR RUTA, FINALIZAR RUTA, TRAER RUTA, GUARDAR RUTA, ARMAR QR, listado de paquetes, registro de paquetes--
if (cluster.isMaster) {
    logBlue(`Proceso master ${process.pid} ejecutándose...`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        logBlue(`Worker ${worker.process.pid} murió, reiniciando...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.use(json());
    app.use(cors());

    app.get('/ping', (req, res) => {
        const currentDate = new Date();
        currentDate.setHours(currentDate.getHours()); // Resta 3 horas

        // Formatear la hora en el formato HH:MM:SS
        const hours = currentDate.getHours().toString().padStart(2, '0');
        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
        const seconds = currentDate.getSeconds().toString().padStart(2, '0');

        const formattedTime = `${hours}:${minutes}:${seconds}`;

        res.status(200).json({
            hora: formattedTime
        });
    });

    (async () => {
        try {
            await redisClient.connect();

            app.use('/api/auth', auth);
            app.use('/api/accounts', accounts);
            app.use('/api/shipments', shipments);
            app.use('/api/settlements', settlements);
            app.use('/api/qr', qr);
            app.use('/api/home', home);
            app.use('/api/users', users);
            app.use('/api/map', map);
            app.use("/api/collect", collect)
            app.use("/api/register-visit", registerVisitRoute);
            ///
            app.listen(PORT, '0.0.0.0', () => {
                logBlue(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
            });
        } catch (err) {
            logRed(`Error al iniciar el servidor: ${err}`);
        }
    })();
}
