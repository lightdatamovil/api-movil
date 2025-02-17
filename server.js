
import express, { json, urlencoded } from 'express';
import accounts from './routes/accounts.js';
import cluster from 'cluster';
import auth from './routes/auth.js';
import shipments from './routes/shipments.js';
import qr from './routes/qr.js';
import rutas from './routes/rutas.js';
import users from './routes/users.js';
import { redisClient } from './db.js';

const numCPUs = 2;
const PORT = 13000;

if (cluster.isMaster) {
    console.log(`Proceso master ${process.pid} ejecutándose...`);

    // Crear los workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Reiniciar workers si alguno falla
    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} murió, reiniciando...`);
        cluster.fork();
    });
} else {
    const app = express();
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));
    app.use(json());

    var AclientesXEmpresa = new Object();
    var AusuariosXEmpresa = new Object();
    var AzonasXEmpresa = new Object();

    app.post('/api/testapi', async (req, res) => {
        res.status(200).json({ message: 'API funcionando correctamente' });
    });

    (async () => {
        try {
            await redisClient.connect();

            app.use('/api/auth', auth);
            app.use('/api/accounts', accounts);
            app.use('/api/shipments', shipments);
            app.use('/api/qr', qr);
            app.use('/api/rutas', rutas);
            app.use('/api/users', users);

            app.listen(PORT, () => {
                console.log(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
            });
        } catch (err) {
            console.error('Error al iniciar el servidor:', err);
        }
    })();
}
