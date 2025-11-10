import { Router } from 'express';
import { getRoute } from '../controller/collect/get_route.js';
import { startCollectRoute } from '../controller/collect/start_route.js';
import { saveRoute } from '../controller/collect/save_route.js';
import { getCollectDetails } from '../controller/collect/get_collect_details.js';
import { shipmentsFromClient } from '../controller/collect/get_shipments_from_client.js';
import { getCollectList } from '../controller/collect/get_collect_list.js';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const collect = Router();

collect.get(
    '/get-route',
    buildHandlerWrapper({
        controller: async ({ db, req, company }) => await getRoute({ db, req, company }),
    })
);

collect.post(
    '/start-route',
    buildHandlerWrapper({
        controller: async ({ db }) => await startCollectRoute({ db }),
    })
);

collect.post(
    '/save-route',
    buildHandlerWrapper({
        required: ['additionalRouteData', 'clientsWithWarehouse', 'cantidad', 'distancia', 'total_km', 'total_minutos', 'camino'],
        controller: async ({ db, req, company }) => await saveRoute({ db, req, company }),
    })
);

collect.get(
    '/get-collect-details/:date',
    buildHandlerWrapper({
        requiredParams: ['date'],
        controller: async ({ db, req }) => await getCollectDetails({ db, req }),
    })
);

collect.get(
    '/get-client-details/:clientId',
    buildHandlerWrapper({
        requiredParams: ['clientId'],
        controller: async ({ db, req }) => await shipmentsFromClient({ db, req }),
    })
);

collect.get(
    '/get-collect-list/:from/:to',
    buildHandlerWrapper({
        requiredParams: ['from', 'to'],
        controller: async ({ db, req }) => await getCollectList({ db, req }),
    })
);

collect.get(
    '/get-settlement-list',
    buildHandlerWrapper({
        required: ['from', 'to'],
        controller: async ({ db, req }) => await getSettlementList({ db, req }),
    })
);

collect.get(
    '/get-settlement-details',
    buildHandlerWrapper({
        required: ['settlementId'],
        controller: async ({ db, req, company }) => await getSettlementDetails({ db, req, company }),
    })
);

export default collect;
