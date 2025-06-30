import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { getCompanyById } from "../db.js";
import { verifyStartedRoute } from "../controller/home/verify_started_route.js";
import { startRoute } from "../controller/home/start_route.js";
import { finishRoute } from "../controller/home/finish_route.js";
import { getHomeData } from "../controller/home/get_home_data.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import { logGreen, logOrange, logPurple, logRed } from "../src/funciones/logsCustom.js";
import CustomException from "../classes/custom_exception.js";
import { crearLog } from "../src/funciones/crear_log.js";

const home = Router();

home.post("/home", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, dateYYYYMMDD } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "profile", "dateYYYYMMDD"],
      true
    );

    if (mensajeError) {
      logRed(`Error en home: ${mensajeError}`);
      throw new CustomException({
        title: "Error en home",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);

    const result = await getHomeData(company, userId, profile, dateYYYYMMDD);

    logGreen(`Datos obtenidos correctamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/home", true);
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logOrange(`Error 400 en home: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/home", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en home: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/home", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

home.post("/start-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, dateYYYYMMDD, deviceFrom } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "dateYYYYMMDD", "deviceFrom"],
      true
    );
    if (mensajeError) {
      logRed(`Error en start-route: ${mensajeError}`);
      throw new CustomException({
        title: "Error en start-route",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    await startRoute(company, userId, dateYYYYMMDD, deviceFrom);

    logGreen(`Ruta comenzada exitosamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify({ message: "Ruta comenzada exitosamente" }), "/start-route", true);
    res
      .status(200)
      .json({ message: "La ruta ha comenzado exitosamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logOrange(`Error 400 en start-route: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/start-route", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en start-route: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/start-route", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

home.post("/end-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile, dateYYYYMMDD } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "dateYYYYMMDD"],
      true
    );
    if (mensajeError) {
      logRed(`Error en end-route: ${mensajeError}`);
      throw new CustomException({
        title: "Error en end-route",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    await finishRoute(company, userId, dateYYYYMMDD);

    logGreen(`Ruta terminada exitosamente`);
    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, "Ruta terminada exitosamente", "/end-route", true);
    res.status(200).json({ message: "La ruta ha terminado exitosamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logOrange(`Error 400 en end-route: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/end-route", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en end-route: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/end-route", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

home.post("/verify-started-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId"],
      true
    );
    if (mensajeError) {
      logRed(`Error en verify-started-route: ${mensajeError}`);
      throw new CustomException({
        title: "Error en verify-started-route",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await verifyStartedRoute(company, userId);

    crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(result), "/verify-started-route", true);
    res.status(200).json({
      body: result,
      message: `La ruta ${result ? "ha comenzado" : "no ha comenzado"}`,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logOrange(`Error 400 en verify-started-route: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error), "/verify-started-route", false);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en verify-started-route: ${error}`);
      crearLog(companyId, userId, profile, req.body, performance.now() - startTime, JSON.stringify(error.message), "/verify-started-route", false);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

export default home;
