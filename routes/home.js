import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { getCompanyById } from "../db.js";
import { verifyStartedRoute } from "../controller/home/verify_started_route.js";
import { startRoute } from "../controller/home/start_route.js";
import { finishRoute } from "../controller/home/finish_route.js";
import { getHomeData } from "../controller/home/get_home_data.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import {
  logCyan,
  logGreen,
  logPurple,
  logRed,
} from "../src/funciones/logsCustom.js";
import CustomException from "../classes/custom_exception.js";

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
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en home: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en home: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

home.post("/start-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, dateYYYYMMDD, deviceFrom } = req.body;
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
    const result = await startRoute(company, userId, dateYYYYMMDD, deviceFrom);

    logGreen(`Ruta comenzada exitosamente`);
    res
      .status(200)
      .json({ body: result, message: "La ruta ha comenzado exitosamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en start-route: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en start-route: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

home.post("/end-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, dateYYYYMMDD } = req.body;
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
    res.status(200).json({ message: "La ruta ha terminado exitosamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en end-route: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en end-route: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

home.post("/verify-started-route", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId } = req.body;
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

    logGreen(`Verificación de ruta iniciada: ${result}`);
    res.status(200).json({
      body: result,
      message: `La ruta ${result ? "ha comenzado" : "no ha comenzado"}`,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en verify-started-route: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en verify-started-route: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución: ${endTime - startTime} ms`);
  }
});

export default home;
