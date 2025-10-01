import { Router } from 'express';
import { shipmentList } from '../controller/shipments/get_shipment_list.js';
import { shipmentDetails } from '../controller/shipments/get_shipment_details.js';
import { nextDeliver } from '../controller/shipments/next_deliver.js';
import { buildHandlerWrapper } from '../src/funciones/build_handler_wrapper.js';

const shipments = Router();

shipments.get(
  '/shipment-list',
  buildHandlerWrapper({
    requiredParams: ['from', 'shipmentStates', 'isAssignedToday'],
    controller: async ({ db, req, company }) => {
      const result = await shipmentList(db, req, company);
      return result;
    },
  })
);

shipments.get(
  '/shipment-details',
  buildHandlerWrapper({
    requiredParams: ['shipmentId'],
    controller: async ({ db, req }) => {
      const result = await shipmentDetails(db, req);
      return result;
    },
  })
);

shipments.post(
  '/next-visit',
  buildHandlerWrapper({
    required: ['shipmentId'],
    controller: async ({ db, req, company }) => {
      const result = await nextDeliver(db, req, company);
      return result;
    },
  })
);

export default shipments;
