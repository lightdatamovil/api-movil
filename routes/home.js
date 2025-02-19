import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { verifyStartedRoute, getHomeData, startRoute, endRoute } from '../controller/homeController/home.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';

const home = Router();

home.post('/home', async (req, res) => {
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId, profile } = req.body;

	try {
		const company = await getCompanyById(companyId);

		const result = await getHomeData(company, userId, profile);

		return res.status(200).json({ body: result, message: "Datos obtenidos correctamente" });
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
});

home.post('/start-route', verifyToken, async (req, res) => {
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);

		let result = await startRoute(company, userId);

		res.status(200).json({ body: result, message: 'La ruta a comenzado exitosamente' });
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
});

home.post('/end-route', verifyToken, async (req, res) => {
	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);

		let result = await endRoute(company, userId);

		res.status(200).json({ body: result, message: 'La ruta a terminado exitosamente' });
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
});

home.post('/verify-started-route', verifyToken, async (req, res) => {

	const mensajeError = verifyParamaters(req.body, [], true);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}

	const { companyId, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);

		let result = await verifyStartedRoute(company, userId);

		res.status(200).json({ body: result, message: `The route has ${result ? 'started' : 'not started'}` });
	} catch (e) {
		res.status(500).json({ message: e.message });
	}
});

export default home;