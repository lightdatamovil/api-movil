import jwt from "jsonwebtoken";
import CustomException from "../../classes/custom_exception.js";
import Status from "../../classes/status.js";

function generateToken({ id, profile, companyId }, secret = 'lightdatito') {
    if (!id || !profile || !companyId) {
        throw new CustomException({
            title: "Token generation error",
            message: "Faltan campos requeridos para generar el token",
            status: Status.badRequest
        });
    }

    const payload = {
        id,
        profile,
        companyId
    };

    const token = jwt.sign(payload, secret);

    return token;
}

export default generateToken;