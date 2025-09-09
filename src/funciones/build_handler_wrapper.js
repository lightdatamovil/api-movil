import { crearLog } from "./crear_log.js";
import { buildHandler } from "lightdata-tools";

export function buildHandlerWrapper({
    required,
    optional,
    headers,
    needsDb,
    status,
    companyResolver,
    controller,
}) {
    return buildHandler({
        required,
        optional,
        headers,
        needsDb,
        status,
        companyResolver,
        controller,
        log: async ({ req, startTime, data, exito }) => {
            await crearLog(req, startTime, JSON.stringify(data), exito);
        },
    })
}