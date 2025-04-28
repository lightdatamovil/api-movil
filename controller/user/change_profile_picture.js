import imageType from 'image-type';
import axios from 'axios';
import CustomException from "../../classes/custom_exception.js";

export async function changeProfilePicture(company, userId, profile, image, dateYYYYMMDD) {
    if (image && image !== "") {
        const imageB64 = image.split(",");

        const decodedData = Buffer.from(imageB64[1], 'base64');

        const imageType = await getImageType(decodedData);

        if (imageType) {
            const data = {
                operador: "guardarImagen",
                didempresa: company.did,
                didUser: userId,
                perfil: profile,
                imagen: image,
                token: dateYYYYMMDD
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await axios.post('https://files.lightdata.app/upload_perfil.php', data, config)

            if (response.data.error) {
                throw new CustomException({
                    title: 'Error en subida de imagen',
                    message: response.data.error,
                });
            }

            return response.data;
        } else {
            throw new CustomException({
                title: 'Error en subida de imagen',
                message: 'Tipo de imagen no soportado',
            });
        }
    }
}

async function getImageType(buffer) {
    const type = await imageType(buffer);
    return type ? type.mime : null;
}