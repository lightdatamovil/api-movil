import { Router } from 'express';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { getSettlementShipmentDetails } from '../controller/settlements/get_settlement_shipment_details.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const settlements = Router();

settlements.get(
    '/settlement-list',
    buildHandlerWrapper({
        requiredParams: ['from', 'to'],
        controller: async ({ db, req }) => {
            const result = await getSettlementList(db, req);
            return result;
        },
    })
);

settlements.get(
    '/settlement-details',
    buildHandlerWrapper({
        requiredParams: ['settlementId'],
        controller: async ({ db, req, company }) => {
            const result = await getSettlementDetails(db, req, company);
            return result;
        },
    })
);

settlements.get(
    '/settlement-shipment-details',
    buildHandlerWrapper({
        controller: async ({ db, req, company }) => {
            const result = await getSettlementShipmentDetails(db, req, company);
            return result;
        },
    })
);

export default settlements;
