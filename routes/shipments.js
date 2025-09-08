import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { shipmentList } from '../controller/shipments/get_shipment_list.js';
import { shipmentDetails } from '../controller/shipments/get_shipment_details.js';
import { nextDeliver } from '../controller/shipments/next_deliver.js';

const shipments = Router();

shipments.post(
  '/shipment-list',
  buildHandler({
    required: ['from', 'shipmentStates', 'isAssignedToday'],
    controller: async ({ db, req, company }) => {
      const result = await shipmentList(db, req, company);
      return result;
    },
  })
);

shipments.post(
  '/shipment-details',
  buildHandler({
    required: ['shipmentId'],
    controller: async ({ db, req }) => {
      const result = await shipmentDetails(db, req);
      return result;
    },
  })
);

shipments.post(
  '/next-visit',
  buildHandler({
    required: ['shipmentId'],
    controller: async ({ db, req, company }) => {
      const result = await nextDeliver(db, req, company);
      return result;
    },
  })
);

export default shipments;
