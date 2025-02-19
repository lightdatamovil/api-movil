import verifyToken from '../src/funciones/verifyToken.js';
import { getCompanyById } from '../db.js';
import { Router } from 'express';
import { accountList } from '../controller/accountsController/accounts.js';
import { verifyParamaters } from '../src/funciones/verifyParameters.js';

const accounts = Router();

accounts.post('/account-list', verifyToken, async (req, res) => {
	const mensajeError = verifyParamaters(req.body, ['username', 'password', 'companyId']);

	if (mensajeError) {
		return res.status(400).json({ message: mensajeError });
	}
	const { companyId, profile, userId } = req.body;

	try {
		const company = await getCompanyById(companyId);

		const result = await accountList(company, userId, profile);

		res.status(200).json({ body: result, message: "Lista de cuentas obtenida correctamente" });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
});

export default accounts;