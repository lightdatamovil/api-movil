import mysql from 'mysql';
import { getProdDbConfig, executeQuery } from '../db.js';

export async function accountList(company, userId, profile) {
    const dbConfig = getProdDbConfig(company);
    const dbConnection = mysql.createConnection(dbConfig);
    dbConnection.connect();

    try {
        const sqlduenio = profile == 2 ? " AND e.didCliente = " + userId : "";

        let accountList = [];

        const query = "SELECT id, did, tipoCuenta, dataCuenta, ML_user, ML_id_vendedor, tn_id, tn_url, woo_api,woo_secreto, woo_web, shop_url,shop_api, shop_api2, clientes_cuentas.data, pre_url, pre_api, vtex_url, vtex_key, vtex_token, ingreso_automatico, fala_key, fala_userid, jumpseller_login, jumpseller_token, fulfillment, me1, sync_woo, flexdata FROM `clientes_cuentas` WHERE didCliente = ?" + sqlduenio;

        const results = await executeQuery(dbConnection, query, [userId]);

        for (let i = 0; i < results.length; i++) {
            const row = results[i];
            let accountName = "";

            if (row.tipoCuenta == 1) {
                accountName = row.ML_id_vendedor;
            } else if (row.tipoCuenta == 2) {
                accountName = row.tn_url;
            } else if (row.tipoCuenta == 3) {
                accountName = row.shop_url;
            } else if (row.tipoCuenta == 4) {
                accountName = row.woo_web;
            } else if (row.tipoCuenta == 5) {
                accountName = row.vtex_url;
            }

            const account = {
                "id": row.id,
                "did": row.did,
                "flex": row.tipoCuenta,
                "dataCuenta": row.dataCuenta,
                "ML_user": row.ML_user,
                "ML_id_vendedor": row.ML_id_vendedor,
                "tn_id": row.tn_id,
                "tn_url": row.tn_url,
                "woo_api": row.woo_api,
                "woo_secreto": row.woo_secreto,
                "woo_web": row.woo_web,
                "shop_url": row.shop_url,
                "shop_api": row.shop_api,
                "shop_api2": row.shop_api2,
                "pre_api": row.pre_api,
                "pre_url": row.pre_url,
                "vtex_url": row.vtex_url,
                "vtex_key": row.vtex_key,
                "vtex_token": row.vtex_token,
                "ingreso_automatico": row.ingreso_automatico,
                "fala_key": row.fala_key,
                "fala_userid": row.fala_userid,
                "jumpseller_login": row.jumpseller_login,
                "jumpseller_token": row.jumpseller_token,
                "fulfillment": row.fulfillment,
                "me1": row.me1,
                "sync_woo": row.sync_woo,
                "flexdata": row.flexdata,
                "nombrecuenta": accountName
            };

            accountList.push(account);
        }
        return accountList;

    } catch (error) {
        logRed(`Error en accountList: ${error.message}`);
        throw error;
    } finally {
        dbConnection.end();
    }
}