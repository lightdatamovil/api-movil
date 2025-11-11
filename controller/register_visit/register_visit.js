import { CustomException, LightdataORM, LogisticaConfig, sendShipmentStateToStateMicroserviceAPI } from "lightdata-tools";
import { getTokenMLconMasParametros } from "../../src/functions/ml/getTokenMLconMasParametros.js";
import { getMlShipment } from "../../src/functions/ml/getMlShipment.js";
import { axiosInstance, urlEstadosMicroservice, urlRegisterVisitUploadImage } from "../../db.js";

export async function registerVisit({ db, req, company }) {
  const {
    shipmentId,
    shipmentState,
    observation,
    recieverDNI,
    recieverName,
    latitude,
    longitude,
    images = [],
  } = req.body;

  const { userId } = req.user;

  const [estadoActual] = await LightdataORM.select({
    db,
    table: "envios_historial",
    where: { didEnvio: shipmentId },
    select: "estado",
    throwIfNotExists: true,
  });

  if (estadoActual.estado === 8) {
    throw new CustomException({
      title: "El envío ya fue cancelado",
      message: "El envío ya fue cancelado",
    });
  }

  if (LogisticaConfig.deliveredMLFirstEnabled(company.did)) {
    const [envio] = await LightdataORM.select({
      db,
      table: "envios",
      where: { did: shipmentId, flex: 1 },
      select: "didCliente, didCuenta, ml_shipment_id",
      throwIfNotExists: true,
    });

    const token = await getTokenMLconMasParametros(
      envio.didCliente,
      envio.didCuenta,
      company.did
    );

    const dataML = await getMlShipment(token, envio.ml_shipment_id);

    if (!dataML || dataML.status !== "delivered") {
      throw new CustomException({
        title: "El envío no fue entregado en MercadoLibre",
        message: "El envío no fue entregado en MercadoLibre",
      });
    }
  }

  await LightdataORM.update({
    db,
    table: "ruteo_paradas",
    where: { didPaquete: shipmentId },
    data: { cerrado: 1 },
    quien: userId,
  });

  const rutaRows = await LightdataORM.select({
    db,
    table: "ruteo_paradas",
    where: { didPaquete: shipmentId },
    select: "didRuteo",
  });

  if (rutaRows.length > 0) {
    const didRuta = rutaRows[0].didRuteo;
    const enviosRuta = await LightdataORM.select({
      db,
      table: "ruteo_paradas",
      where: { didRuteo: didRuta },
      select: "cerrado",
    });

    const todosCerrados = enviosRuta.every((e) => e.cerrado === 1);
    if (todosCerrados) {
      await LightdataORM.update({
        db,
        table: "ruteo",
        where: { did: didRuta },
        data: { superado: 1 },
        quien: userId,
      });
    }
  }

  await LightdataORM.insert({
    db,
    table: "envios_recibe",
    data: {
      didEnvio: shipmentId,
      dni: recieverDNI,
      nombre: recieverName,
      ilat: latitude,
      ilong: longitude,
    },
    quien: userId,
  });

  const estadosPrevios = await LightdataORM.select({
    db,
    table: "envios_historial",
    where: { didEnvio: shipmentId, superado: [0, 1] },
    select: "estado",
  });

  if (estadoActual.estado === 5) {
    throw new CustomException({
      title: "El envío ya fue entregado",
      message: "El envío ya fue entregado",
    });
  }

  if (company.did === 167) {
    const cantidadNadie = estadosPrevios.filter((e) =>
      [6, 9].includes(Number(e.estado))
    ).length;
    if (cantidadNadie > 2) {
      throw new CustomException({
        title: "Límite de estados 'nadie'",
        message:
          "No se puede registrar la visita porque hay más de dos estados 'nadie'.",
      });
    }
  }

  const hayEstado6 = estadosPrevios.some((e) => Number(e.estado) === 6);
  const estadoInsert =
    hayEstado6 && shipmentState === 5
      ? 9
      : hayEstado6 && shipmentState === 6
        ? company.did === 4
          ? 6
          : 10
        : shipmentState;

  const response = await sendShipmentStateToStateMicroserviceAPI({
    urlEstadosMicroservice,
    axiosInstance,
    company,
    userId,
    estado: estadoInsert,
    shipmentId,
    latitude,
    longitude,
    desde: "Registrar Visita App",
  });

  const idInsertado = response.id;

  await Promise.all([
    LightdataORM.update({
      db,
      table: "envios_asignaciones",
      where: { did: shipmentId },
      data: { estado: estadoInsert },
      quien: userId,
    }),
  ]);

  if (observation) {
    await LightdataORM.insert({
      db,
      table: "envios_observaciones",
      data: {
        didEnvio: shipmentId,
        observacion: observation,
      },
      quien: userId,
    });
  }

  if (Array.isArray(images) && images.length > 0) {
    const uploadPromises = images.map(async (image) => {
      try {
        const reqBody = {
          imagen: image,
          didenvio: shipmentId,
          quien: userId,
          idEmpresa: company.did,
        };

        const response = await axiosInstance.post(urlRegisterVisitUploadImage, reqBody, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.data) {
          throw new Error("Respuesta vacía al subir imagen");
        }

        await LightdataORM.insert({
          db,
          table: "envios_fotos",
          data: {
            didEnvio: shipmentId,
            nombre: Array.isArray(response.data)
              ? response.data.join(",")
              : response.data,
            server: 1,
            id_estado: idInsertado,
            estado: estadoInsert,
          },
          quien: userId,
        });

        if (company.did === 334 && [6, 10].includes(estadoInsert)) {
          await LightdataORM.update({
            db,
            table: "envios_historial",
            data: { conFoto: 1 },
            where: { didEnvio: shipmentId },
            quien: userId,
          });
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    const errores = results
      .filter((r) => r.status === "fulfilled" && !r.value.success)
      .map((r) => r.value.error);

    if (errores.length > 0) {
      console.warn("⚠️ Algunas imágenes fallaron:", errores);
    }
  }

  return {
    success: true,
    data: {
      lineId: idInsertado,
      shipmentState: estadoInsert,
    },
    message: "Visita registrada correctamente",
    meta: {},
  };
}
