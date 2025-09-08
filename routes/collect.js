import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { getRoute } from '../controller/collect/get_route.js';
import { startCollectRoute } from '../controller/collect/start_route.js';
import { saveRoute } from '../controller/collect/save_route.js';
import { getCollectDetails } from '../controller/collect/get_collect_details.js';
import { shipmentsFromClient } from '../controller/collect/get_shipments_from_client.js';
import { getCollectList } from '../controller/collect/get_collect_list.js';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';

const collect = Router();

collect.get(
    '/get-route',
    buildHandler({
        controller: async ({ db, req, company }) => {
            const result = await getRoute(db, req, company);
            return result;
        },
    })
);

collect.post(
    '/start-route',
    buildHandler({
        controller: async ({ db }) => {
            const result = await startCollectRoute(db);
            return result;
        },
    })
);

collect.post(
    '/save-route',
    buildHandler({
        required: ['operationDate', 'additionalRouteData', 'orders'],
        controller: async ({ db, req, company }) => {
            const result = await saveRoute(db, req, company);
            return result;
        },
    })
);

collect.get(
    '/get-collect-details',
    buildHandler({
        controller: async ({ db, req, company }) => {
            const result = await getCollectDetails(db, req, company);
            return result;
        },
    })
);

collect.get(
    '/get-client-details',
    buildHandler({
        required: ['clientId'],
        controller: async ({ db, req, company }) => {
            const result = await shipmentsFromClient(db, req, company);
            return result;
        },
    })
);

collect.get(
    '/get-collect-list',
    buildHandler({
        required: ['from', 'to'],
        controller: async ({ db, req }) => {
            const result = await getCollectList(db, req);
            return result;
        },
    })
);

collect.get(
    '/get-settlement-list',
    buildHandler({
        required: ['from', 'to'],
        controller: async ({ db, req }) => {
            const result = await getSettlementList(db, req);
            return result;
        },
    })
);

collect.get(
    '/get-settlement-details',
    buildHandler({
        required: ['settlementId'],
        controller: async ({ db, req, company }) => {
            const result = await getSettlementDetails(db, req, company);
            return result;
        },
    })
);

export default collect;
