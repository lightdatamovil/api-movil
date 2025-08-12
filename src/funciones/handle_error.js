import CustomException from "../../classes/custom_exception.js";
import Status from "../../classes/status.js";
import { logRed } from "./logsCustom.js";



/**
 * Envía la respuesta de error apropiada y loguea, según el tipo de excepción.
 * @param {Request}  req  – para saber método y URL
 * @param {Response} res  – para enviar la respuesta
 * @param {Error}    err  – la excepción capturada
 */
export function handleError(req, res, err) {
    let ex;

    if (err instanceof CustomException) {
        ex = err;
    } else {
        ex = new CustomException({
            title: 'Internal Server Error',
            message: err.message,
            stack: err.stack,
            status: Status.internalServerError
        });
    }


    return res.status(ex.status).json(ex.toJSON());
}