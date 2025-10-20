import { Router } from 'express';
import { verifyToken } from 'lightdata-tools';
import { jwtSecret, jwtIssuer, jwtAudience, companiesService } from '../db.js';
import { identification } from '../controller/auth/identification.js';
import { login } from '../controller/auth/login.js';
import { whatsappMessagesList } from '../controller/auth/whatsappMessagesList.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const auth = Router();

auth.post(
    '/company-identification',
    buildHandlerWrapper({
        required: ['companyCode'],
        companyResolver2: async ({ req }) => companiesService.getByCode(req.body.companyCode),
        controller: async ({ db, company }) => await identification({ db, company }),
    })
);

auth.post(
    '/login',
    buildHandlerWrapper({
        required: ['username', 'password', 'companyId'],
        companyResolver2: async ({ req }) => companiesService.getById(req.body.companyId),
        controller: async ({ db, req, company }) => await login({ db, req, company }),
    })
);

//! Protegido: requiere token; company desde req.user
auth.get(
    '/whatsapp-message-list',
    verifyToken({ jwtSecret, jwtIssuer, jwtAudience }),
    buildHandlerWrapper({
        controller: async ({ db }) => await whatsappMessagesList({ db }),
    })
);

export default auth;
