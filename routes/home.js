import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { verifyStartedRoute, getHomeData } from '../controller/homeController/home.js';

const home = Router();

home.post('/home', async (req, res) => {
	const { companyId, userId, profile, deviceId, appVersion, brand, model, androidVersion, dashboardValue } = req.body;

	if (!companyId || !userId || !profile || !deviceId || !appVersion || !brand || !model || !androidVersion) {
		return res.status(400).json({ message: "Faltan datos" });
	}

	try {
		const company = await getCompanyById(companyId);

		const result = await getHomeData(company, userId, profile);

		return res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

home.post('/start-route', verifyToken, async (req, res) => {
	res.status(200).json({ message: "WORK IN PROGRESS" });
});

home.post('/end-route', verifyToken, async (req, res) => {
	res.status(200).json({ message: "WORK IN PROGRESS" });
});

home.post('/verify-started-route', verifyToken, async (req, res) => {
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

export default home;