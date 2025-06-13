import { Router } from "express";
import verifyToken from "../src/funciones/verifyToken.js";
import { getCompanyById } from "../db.js";
import { getShipmentIdFromQr } from "../controller/qr/get_shipment_id.js";
import { getProductsFromShipment } from "../controller/qr/get_products.js";
import { enterFlex } from "../controller/qr/enter_flex.js";
import { getSkuAndStockNoFlex as getSkuAndStockNoFlex } from "../controller/qr/get_sku_and_stock_no_flex.js";
import { armado } from "../controller/qr/armado.js";
import { verifyParamaters } from "../src/funciones/verifyParameters.js";
import { logGreen, logPurple, logRed, logYellow } from "../src/funciones/logsCustom.js";
import CustomException from "../classes/custom_exception.js";
import { driverList } from "../controller/qr/get_driver_list.js";
import { crossDocking } from "../controller/qr/cross_docking.js";
import { getSkuAndStockFlex } from "../controller/qr/get_sku_and_stock _flex.js";

const qr = Router();

qr.post("/driver-list", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId } = req.body;
  try {
    const mensajeError = verifyParamaters(req.body, ["companyId"], true);
    if (mensajeError) {
      logRed(`Error en driver-list: ${mensajeError}`);
      throw new CustomException({
        title: "Error en driver-list",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await driverList(company);

    logGreen(`Listado de choferes obtenido correctamente`);
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en driver-list: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en driver-list: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución driver-list: ${endTime - startTime} ms`);
  }
});

qr.post("/cross-docking", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en cross-docking: ${mensajeError}`);
      throw new CustomException({
        title: "Error en cross-docking",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const response = await crossDocking(dataQr, company);

    logGreen(`Cross-docking completado correctamente`);
    res
      .status(200)
      .json({ body: response, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en cross-docking: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en cross-docking: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución cross-docking: ${endTime - startTime} ms`);
  }
});

qr.post("/get-shipment-id", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en get-shipment-id: ${mensajeError}`);
      throw new CustomException({
        title: "Error en get-shipment-id",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const response = await getShipmentIdFromQr(dataQr, company);

    logGreen(`ID de envío obtenido correctamente`);
    res.status(200).json({
      success: true,
      body: `${response}`,
      message: "Datos obtenidos correctamente",
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en get-shipment-id: ${error.toJSON()}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en get-shipment-id: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución get-shipment-id: ${endTime - startTime} ms`);
  }
});

qr.post("/products-from-shipment", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(req.body, ["dataQr"], true);
    if (mensajeError) {
      logRed(`Error en products-from-shipment: ${mensajeError}`);
      throw new CustomException({
        title: "Error en products-from-shipment",
        message: mensajeError,
      });
    }

    const response = await getProductsFromShipment(dataQr);

    logGreen(`Productos obtenidos correctamente`);
    res
      .status(200)
      .json({ body: response, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en products-from-shipment: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en products-from-shipment: ${error}`);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor." });
    }
  } finally {
    const endTime = performance.now();
    logPurple(
      `Tiempo de ejecución products-from-shipment: ${endTime - startTime} ms`
    );
  }
});

qr.post("/enter-flex", async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, dataQr, profile } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "userId", "profile", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en enter-flex: ${mensajeError}`);
      throw new CustomException({
        title: "Error en enter-flex",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await enterFlex(company, dataQr, userId, profile);

    logGreen(`Enter flex ejecutado correctamente`);
    res
      .status(200)
      .json({ body: result, message: "Datos obtenidos correctamente" });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en enter-flex: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en enter-flex: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución enter-flex: ${endTime - startTime} ms`);
  }
});

qr.post("/sku", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, dataQr } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["companyId", "dataQr"],
      true
    );
    if (mensajeError) {
      logRed(`Error en sku: ${mensajeError}`);
      throw new CustomException({
        title: "Error en sku",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const isLocal = dataQr.hasOwnProperty("local");
    let result;
    if (isLocal) {
      result = await getSkuAndStockNoFlex(company, dataQr);
    } else {
      result = await getSkuAndStockFlex(company, dataQr);
    }

    logGreen(`SKU y cantidad de ítems obtenidos correctamente`);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en sku: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en sku: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución sku: ${endTime - startTime} ms`);
  }
});

qr.post("/armado", verifyToken, async (req, res) => {
  const startTime = performance.now();
  const { companyId, userId, dataEnvios, didCliente, fecha } = req.body;
  try {
    const mensajeError = verifyParamaters(
      req.body,
      ["userId", "dataEnvios", "didCliente", "fecha"],
      true
    );
    if (mensajeError) {
      logRed(`Error en armado: ${mensajeError}`);
      throw new CustomException({
        title: "Error en armado",
        message: mensajeError,
      });
    }

    const company = await getCompanyById(companyId);
    const result = await armado(company, userId, dataEnvios, didCliente, fecha);

    logGreen(`Armado ejecutado correctamente`);
    res.status(200).json({
      body: result,
      message: "Datos obtenidos correctamente",
      success: true,
    });
  } catch (error) {
    if (error instanceof CustomException) {
      logRed(`Error 400 en armado: ${error}`);
      res.status(400).json({ title: error.title, message: error.message });
    } else {
      logRed(`Error 500 en armado: ${error}`);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } finally {
    const endTime = performance.now();
    logPurple(`Tiempo de ejecución armado: ${endTime - startTime} ms`);
  }
});

export default qr;
