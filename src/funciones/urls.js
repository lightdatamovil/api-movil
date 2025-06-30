
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENV_FILE || `.env` });
const PORT = process.env.PORT;
const LOCAL = process.env.LOCAL;

export function getUrls() {
  const urlBase = LOCAL == 'true'
    ? `http://10.0.0.2:${PORT}`
    : `http://apimovil2${PORT == 13000 ? '' : 'test'}.lightdata.app`;

  const urls = {
    /// HOME
    home: [`${urlBase}/api/home/home`],
    startRoute: [`${urlBase}/api/home/start-route`],
    endRoute: [`${urlBase}/api/home/end-route`],
    verifyStartedRoute: [`${urlBase}/api/home/verify-started-route`],

    /// SHIPMENT-LIST
    shipmentList: [`${urlBase}/api/shipments/shipment-list`],
    shipmentDetails: [`${urlBase}/api/shipments/shipment-details`],
    nextToDeliver: [`${urlBase}/api/shipments/next-visit`],

    registerVisit: [`${urlBase}/api/register-visit/register`],
    saveImage: [`${urlBase}/api/register-visit/upload-image`],

    /// SETTLEMENTS
    settlementList: [`${urlBase}/api/settlements/get-settlement-list`],
    settlementDetails: [`${urlBase}/api/settlements/get-settlement-details`],
    settlementShipmentDetails: [`${urlBase}/api/settlements/settlement-shipment-details`],

    /// MAP
    geolocalize: [`${urlBase}/api/map/geolocalize`],
    getRoute: [`${urlBase}/api/map/get-route-by-user`],
    saveRoute: [`${urlBase}/api/map/save-route`],

    /// QR
    driverList: [`${urlBase}/api/qr/driver-list`],
    readQr: [`${urlBase}/api/qr/get-shipment-id`],
    crossdocking: [`${urlBase}/api/qr/cross-docking`],
    enterFlex: [`${urlBase}/api/qr/enter-flex`],
    colecta: [`https://colecta.lightdata.app/api/colecta`],
    aplanta: [`https://aplanta.lightdata.app/api/aplanta`],
    assignment: [`https://asignaciones.lightdata.app/api/asignaciones/asignar`],
    unassignment: [`https://asignaciones.lightdata.app/api/asignaciones/desasignar`],
    productsFromShipment: [`${urlBase}/api/qr/products-from-shipment`],

    /// PROFILE
    changePassword: [`${urlBase}/api/users/change-password`],
    editUser: [`${urlBase}/api/users/edit-user`],
    changeProfilePicture: [`${urlBase}/api/users/change-profile-picture`],

    /// COLLECT MODULE
    collectGetRoute: [`${urlBase}/api/collect/get-collect-details`],
    collectStartRoute: [`${urlBase}/api/collect/start-route`],
    collectSaveRoute: [`${urlBase}/api/collect/save-route`],
    collectDetails: [`${urlBase}/api/collect/get-collect-details`],
    collectClientDetails: [`${urlBase}/api/collect/get-collect-details`],
    collectList: [`${urlBase}/api/collect/get-collect-list`],
    collectSettlementList: [`${urlBase}/api/collect/get-collect-details`],
    collectSettlementDetails: [`${urlBase}/api/collect/get-collect-details`],
    sku: [`${urlBase}/api/qr/sku`],
    armado: [`${urlBase}/api/qr/armado`],
    /// ACCOUNTS
    cuentas_listado: [`${urlBase}/api/accounts/account-list`],
    cuentas_alta: [`https://lightdata.app/g/instalation/responseDetalleCuenta.php`],

    /// BACKGPS
    backgps: [`https://backgps.lightdata.app/backgps`],

    /// WSP
    wsp: [`${urlBase}/api/auth/whatsapp-message-list`],

    /// PRIVACY POLICY
    privacyPolicy: [`https://lightdata.app/privacyapp.html`],
  };

  return urls;
}
