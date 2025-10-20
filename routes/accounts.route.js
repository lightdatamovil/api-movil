import { Router } from 'express';
import { accountList } from '../controller/accounts/accountList.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const accounts = Router();

accounts.get(
	'/account-list',
	buildHandlerWrapper({
		controller: async ({ db, req }) => await accountList({ db, req }),
	})
);

export default accounts;
