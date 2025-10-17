import { LightdataORM, CustomException, Status } from "lightdata-tools";

export async function accountList(dbConnection, req) {
    const { userId, profile } = req.user;

    const where = profile == 2
        ? { didCliente: userId }
        : {};

    const results = await LightdataORM.select({
        dbConnection,
        table: "clientes_cuentas",
        where: { ...where, didCliente: userId },
        select: `
            id, did, tipoCuenta, dataCuenta, ML_user, ML_id_vendedor,
            tn_id, tn_url, woo_api, woo_secreto, woo_web,
            shop_url, shop_api, shop_api2, data, pre_url, pre_api,
            vtex_url, vtex_key, vtex_token, ingreso_automatico,
            fala_key, fala_userid, jumpseller_login, jumpseller_token,
            fulfillment, me1, sync_woo, flexdata
        `
    });

    if (!results.length) {
        throw new CustomException({
            title: "Sin cuentas",
            message: "No se encontraron cuentas asociadas al usuario.",
            status: Status.notFound,
        });
    }

    const data = results.map(row => {
        let accountName = "";
        switch (Number(row.tipoCuenta)) {
            case 1: accountName = row.ML_id_vendedor; break;
            case 2: accountName = row.tn_url; break;
            case 3: accountName = row.shop_url; break;
            case 4: accountName = row.woo_web; break;
            case 5: accountName = row.vtex_url; break;
        }

        return {
            id: row.id,
            did: row.did,
            flex: row.tipoCuenta,
            dataCuenta: row.dataCuenta,
            ML_user: row.ML_user,
            ML_id_vendedor: row.ML_id_vendedor,
            tn_id: row.tn_id,
            tn_url: row.tn_url,
            woo_api: row.woo_api,
            woo_secreto: row.woo_secreto,
            woo_web: row.woo_web,
            shop_url: row.shop_url,
            shop_api: row.shop_api,
            shop_api2: row.shop_api2,
            pre_api: row.pre_api,
            pre_url: row.pre_url,
            vtex_url: row.vtex_url,
            vtex_key: row.vtex_key,
            vtex_token: row.vtex_token,
            ingreso_automatico: row.ingreso_automatico,
            fala_key: row.fala_key,
            fala_userid: row.fala_userid,
            jumpseller_login: row.jumpseller_login,
            jumpseller_token: row.jumpseller_token,
            fulfillment: row.fulfillment,
            me1: row.me1,
            sync_woo: row.sync_woo,
            flexdata: row.flexdata,
            nombrecuenta: accountName,
        };
    });

    return {
        success: true,
        data,
        message: "Lista de cuentas obtenida correctamente",
        meta: { total: data.length },
    };
}
