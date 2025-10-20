import { Router } from 'express';
import { shipmentList } from '../controller/shipments/get_shipment_list.js';
import { shipmentDetails } from '../controller/shipments/get_shipment_details.js';
import { nextDeliver } from '../controller/shipments/next_deliver.js';
import { buildHandlerWrapper } from '../src/functions/build_handler_wrapper.js';

const shipments = Router();

shipments.get(
  '/shipment-list',
  buildHandlerWrapper({
    requiredParams: ['from', 'to', 'shipmentStates', 'isAssignedToday'],
    controller: async ({ db, req, company }) => await shipmentList({ db, req, company }),
  })
);

shipments.get(
  '/shipment-details',
  buildHandlerWrapper({
    requiredParams: ['shipmentId'],
    controller: async ({ db, req }) => await shipmentDetails({ db, req }),
  })
);

shipments.post(
  '/next-visit',
  buildHandlerWrapper({
    required: ['shipmentId'],
    controller: async ({ db, req, company }) => await nextDeliver({ db, req, company }),
  })
);

export default shipments;
