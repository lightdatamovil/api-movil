import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { accountList } from '../controller/accounts/accountList.js';

const accounts = Router();

accounts.get(
	'/account-list',
	buildHandler({
		controller: async ({ db, req }) => {
			const result = await accountList(db, req);
			return result;
		},
	})
);

export default accounts;
