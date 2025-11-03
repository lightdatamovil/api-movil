import { getFechaConHoraLocalDePais, LightdataORM } from 'lightdata-tools';

export async function finishRoute({ db, req }) {
    const { company, userId } = req.user;

    const dateConHora = getFechaConHoraLocalDePais(company.pais);
    const hour = dateConHora.split(' ')[1];

    await LightdataORM.insert({
        db,
        table: "cadetes_movimientos",
        data: {
            didCadete: userId,
            tipo: 1,
            desde: 3
        }
    });
    await LightdataORM.update({
        table: "ruteo",
        db,
        data: { hs_finApp: hour },
        where: { didChofer: userId }
    });

}