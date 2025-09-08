import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { getSettlementList } from '../controller/settlements/get_settlement_list.js';
import { getSettlementDetails } from '../controller/settlements/get_settlement_details.js';
import { getSettlementShipmentDetails } from '../controller/settlements/get_settlement_shipment_details.js';

const settlements = Router();

settlements.post(
    '/settlement-list',
    buildHandler({
        required: ['from', 'to'],
        controller: async ({ db, req }) => {
            const result = await getSettlementList(db, req);
            return result;
        },
    })
);

settlements.post(
    '/settlement-details',
    buildHandler({
        required: ['settlementId'],
        controller: async ({ db, req, company }) => {
            const result = await getSettlementDetails(db, req, company);
            return result;
        },
    })
);

settlements.post(
    '/settlement-shipment-details',
    buildHandler({
        controller: async ({ db, req, company }) => {
            const result = await getSettlementShipmentDetails(db, req, company);
            return result;
        },
    })
);

export default settlements;
