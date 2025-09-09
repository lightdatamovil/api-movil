import { Router } from 'express';
import { verifyToken } from 'lightdata-tools';
import { jwtSecret, companiesService } from '../db.js';
import { identification } from '../controller/auth/identification.js';
import { login } from '../controller/auth/login.js';
import { whatsappMessagesList } from '../controller/auth/whatsappMessagesList.js';
import { buildHandlerWrapperWrapper } from './accounts.js';

const auth = Router();

auth.post(
    '/company-identification',
    buildHandlerWrapperWrapper({
        required: ['companyCode'],
        companyResolver: async ({ req }) => companiesService.getByCode(req.body.companyCode),
        controller: async ({ db, company }) => {
            const result = await identification(db, company);
            return result;
        },
    })
);

auth.post(
    '/login',
    buildHandlerWrapperWrapper({
        required: ['username', 'password', 'companyId'],
        companyResolver: async ({ req }) => companiesService.getById(req.body.companyId),
        controller: async ({ db, req, company }) => {
            const result = await login(db, req, company);
            return result;
        },
    })
);

//! Protegido: requiere token; company desde req.user
auth.get(
    '/whatsapp-message-list',
    verifyToken(jwtSecret),
    buildHandlerWrapperWrapper({
        controller: async ({ db }) => {
            const result = await whatsappMessagesList(db);
            return result;
        },
    })
);

export default auth;
