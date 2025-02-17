import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { verifyStartedRoute } from '../controller/rutasController/rutas.js';

const rutas = Router();

rutas.post('/start-route', verifyToken, async (req, res) => {
	res.status(200).json({ message: "WORK IN PROGRESS" });
});

rutas.post('/end-route', verifyToken, async (req, res) => {
	res.status(200).json({ message: "WORK IN PROGRESS" });
});

rutas.post('/verify-started-route', verifyToken, async (req, res) => {
	const { companyId, profile, userId, deviceId, model, brand, androidVersion, appVersion } = req.body;

	if (!companyId || !profile || !userId || !deviceId || !model || !brand || !androidVersion || !appVersion) {
		return res.status(400).json({ message: 'Faltan datos' });
	}

	try {
		const company = await getCompanyById(companyId);

		let result = await verifyStartedRoute(company, userId);

		res.status(200).json({ body: result, message: `The route has ${result ? 'started' : 'not started'}` });
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
});

export default rutas;