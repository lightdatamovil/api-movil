// routes/home.js
import { Router } from 'express';
import { buildHandler } from './_handler.js';
import { verifyStartedRoute } from '../controller/home/verify_started_route.js';
import { startRoute } from '../controller/home/start_route.js';
import { finishRoute } from '../controller/home/finish_route.js';
import { getHomeData } from '../controller/home/get_home_data.js';

const home = Router();

home.post(
  '/home',
  buildHandler({
    controller: async ({ db, req }) => {
      const result = await getHomeData(db, req);
      return result;
    },
  })
);

home.post(
  '/start-route',
  buildHandler({
    controller: async ({ db, req, company }) => {
      const result = await startRoute(db, req, company);
      return result;
    },
  })
);

home.post(
  '/end-route',
  buildHandler({
    controller: async ({ db, req }) => {
      const result = await finishRoute(db, req);
      return result;
    },
  })
);

home.post(
  '/verify-started-route',
  buildHandler({
    controller: async ({ db, req }) => {
      const result = await verifyStartedRoute(db, req);
      return result;
    },
  })
);

export default home;
