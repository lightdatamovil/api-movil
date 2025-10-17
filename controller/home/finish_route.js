import { getFechaConHoraLocalDePais, LightdataORM } from 'lightdata-tools';

export async function finishRoute(dbConnection, req) {
    const { company, userId } = req.user;

    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    const hour = dateConHora.split(' ')[1];

    await LightdataORM.insert({
        dbConnection,
        table: "cadetes_movimientos",
        data: {
            didCadete: userId,
            tipo: 1,
            desde: 3
        }
    });
    await LightdataORM.update({
        table: "ruteo",
        dbConnection,
        data: { hs_finApp: hour },
        where: { didChofer: userId }
    });

}