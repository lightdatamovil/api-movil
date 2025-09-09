import { Router } from 'express';
import { accountList } from '../controller/accounts/accountList.js';
import { buildHandlerWrapperWrapper } from '../src/funciones/build_handler_wrapper.js';

const accounts = Router();

accounts.get(
	'/account-list',
	buildHandlerWrapperWrapper({
		controller: async ({ db, req }) => {
			const result = await accountList(db, req);
			return result;
		},
	})
);

export default accounts;
