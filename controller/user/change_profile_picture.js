import imageType from 'image-type';
import { CustomException, getFechaLocalDePais } from 'lightdata-tools';
import { axiosInstance } from '../../db.js';

export async function changeProfilePicture({ req, company }) {
    const { image } = req.body;
    const { userId, profile } = req.user;

    if (image && image !== "") {
        const imageB64 = image.split(",");

        const decodedData = Buffer.from(imageB64[1], 'base64');

        const imgType = await imageType(decodedData);
        const token = getFechaLocalDePais(company.pais);
        if (imgType) {
            const data = {
                operador: "guardarImagen",
                didempresa: company.did,
                didUser: userId,
                perfil: profile,
                imagen: image,
                token: token
            };

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const response = await axiosInstance.post('https://files.lightdata.app/upload_perfil.php', data, config)

            if (response.data.error) {
                throw new CustomException({
                    title: 'Error en subida de imagen',
                    message: response.data.error,
                });
            }

            return { data: response.data, message: "Datos insertados correctamente" };
        } else {
            throw new CustomException({
                title: 'Error en subida de imagen',
                message: 'Tipo de imagen no soportado',
            });
        }
    }
}
