const cluster = require('cluster');
const os = require('os');
const express = require('express');
const bodyParser = require('body-parser');
const accounts = require('./routes/accounts');
const auth = require('./routes/auth');
const shipments = require('./routes/shipments');
const qr = require('./routes/qr');
const rutas = require('./routes/rutas');
const { redisClient } = require('./db');

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
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(express.json());

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

            app.listen(PORT, () => {
                console.log(`Worker ${process.pid} escuchando en el puerto ${PORT}`);
            });
        } catch (err) {
            console.error('Error al iniciar el servidor:', err);
        }
    })();
}
