// routes/shipments.js
import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { companiesService } from '../db.js';

import { shipmentList } from '../controller/shipments/get_shipment_list.js';
import { shipmentDetails } from '../controller/shipments/get_shipment_details.js';
import { nextDeliver } from '../controller/shipments/next_deliver.js';

const shipments = Router();

// Resolver company: token -> body.companyId
const resolveCompany = async ({ req }) => {
  const cid = req.user?.companyId ?? req.body?.companyId;
  return cid ? companiesService.getById(cid) : null;
};

// POST /shipment-list
shipments.post(
  '/shipment-list',
  buildHandler({
    required: ['from', 'shipmentStates', 'isAssignedToday'],
    companyResolver: resolveCompany,
    controller: async ({ db, req, company }) => {
      const result = await shipmentList(db, req, company);
      return result; // 200 OK
    },
  })
);

// POST /shipment-details
shipments.post(
  '/shipment-details',
  buildHandler({
    required: ['shipmentId'],
    companyResolver: resolveCompany, // opcional aquí, pero lo dejamos uniforme
    controller: async ({ db, req }) => {
      const result = await shipmentDetails(db, req);
      return result; // 200 OK
    },
  })
);

// POST /next-visit (no requiere DB)
shipments.post(
  '/next-visit',
  buildHandler({
    required: ['shipmentId'],
    needsDb: false,
    companyResolver: resolveCompany,
    controller: async ({ req, company }) => {
      const userId = req.user?.userId ?? req.body?.userId;
      const { shipmentId } = req.body;
      const result = await nextDeliver(company, shipmentId, userId);
      return result; // 200 OK
    },
  })
);

export default shipments;
