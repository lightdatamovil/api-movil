import { executeQuery, getFechaLocalDePais } from 'lightdata-tools';

export async function getCollectDetails(dbConnection, req, company) {
    const { userId } = req.user;
    const datetime = getFechaLocalDePais(company.pais);
    const clientesResult = await executeQuery(
        dbConnection,
        "SELECT did, nombre_fantasia FROM clientes WHERE superado=0 AND elim=0"
    );

    let Aclientes = {};

    clientesResult.forEach(row => {
        Aclientes[row.did] = row.nombre_fantasia;
    });

    const enviosResult = await executeQuery(
        dbConnection,
        `SELECT didCliente, didEnvio 
             FROM colecta_asignacion 
             WHERE superado = 0 AND elim = 0 AND didChofer = ? AND fecha = ? `,
        [userId, datetime]
    );

    let collectDetails = {};

    enviosResult.forEach(row => {
        if (!collectDetails[row.didCliente]) {
            collectDetails[row.didCliente] = {
                nombre_fantasia: Aclientes[row.didCliente] || "Cliente desconocido",
                total: 0
            };
        }
        collectDetails[row.didCliente].total += 1;
    });

    let respuesta = Object.entries(collectDetails).map(([id, data]) => ({
        id,
        ...data
    }));

    return { body: respuesta, message: "Colecta obtenida correctamente" };
}