import { Router } from 'express';
import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { accountList } from '../controller/accounts/accountList.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';
import CustomException from '../classes/custom_exception.js';
import { crearLog } from '../src/funciones/crear_log.js';

const accounts = Router();

accounts.post('/account-list', verifyToken, async (req, res) => {
	const startTime = performance.now();
	const { companyId, userId, profile } = req.body;

	try {
		const mensajeError = verifyParamaters(req.body, ['companyId', 'userId', 'profile']);
		if (mensajeError) {
			throw new CustomException({
				title: 'Error trayendo la lista de cuentas',
				message: mensajeError
			});
		}

		const company = await getCompanyById(companyId);
		const result = await accountList(company, userId, profile);

		crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/account-list", true);
		res.status(200).json({ body: result, message: "Lista de cuentas obtenida correctamente" });
	} catch (error) {
		if (error instanceof CustomException) {
			crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/account-list", false);
			res.status(400).json({ title: error.title, message: error.message });
		} else {
			crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/account-list", false);
			res.status(500).json({ message: 'Error interno del servidor' });
		}
	} finally {
	}
});

export default accounts;
