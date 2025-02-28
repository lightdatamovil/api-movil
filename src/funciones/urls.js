
export function getUrls(company) {
    const urls = {
        /// HOME
        home: ["http://apimovil2.lightdata.app/api/home/home"],
        startRoute: ["http://apimovil2.lightdata.app/api/home/start-route"],
        endRoute: ["http://apimovil2.lightdata.app/api/home/end-route"],
        verifyStartedRoute: ["http://apimovil2.lightdata.app/api/home/verify-started-route"],

        /// SHIPMENT-LIST
        shipmentList: ["http://apimovil2.lightdata.app/api/shipments/shipment-list"],
        shipmentDetails: ["http://apimovil2.lightdata.app/api/shipments/shipment-details"],
        nextToDeliver: ["http://apimovil2.lightdata.app/api/shipments/next-visit"],

        registerVisit: ["http://apimovil2.lightdata.app/api/register-visit/register"],
        saveImage: ["http://apimovil2.lightdata.app/api/register-visit/upload-image"],

        /// SETTLEMENTS
        settlementList: ["http://apimovil2.lightdata.app/api/settlements/get-settlement-list"],
        settlementDetails: ["http://apimovil2.lightdata.app/api/settlements/get-settlement-details"],
        settlementShipmentDetails: ["http://apimovil2.lightdata.app/api/settlements/settlement-shipment-details"],

        /// MAP
        geolocalize: ["http://apimovil2.lightdata.app/api/map/geolocalize"],
        getRoute: ["http://apimovil2.lightdata.app/api/map/get-route-by-user"],
        saveRoute: ["http://apimovil2.lightdata.app/api/map/save-route"],

        /// QR
        driverList: ["http://apimovil2.lightdata.app/api/qr/driver-list"],
        readQr: ["http://apimovil2.lightdata.app/api/qr/get-shipment-id"],
        crossdocking: ["http://apimovil2.lightdata.app/api/qr/cross-docking"],
        enterFlex: ["http://apimovil2.lightdata.app/api/qr/enter-flex"],
        colecta: ["https://apimovil.lightdata.app/api/envios/colecta.php"],
        aplanta: ["https://apimovil.lightdata.app/api/envios/aplanta.php"],
        assignment: ["https://asignaciones.lightdata.app/api/asignaciones/asignar"],
        unassignment: ["https://asignaciones.lightdata.app/api/asignaciones/desasignar"],
        productsFromShipment: ["http://apimovil2.lightdata.app/api/qr/products-from-shipment"],

        /// PROFILE
        changePassword: ["http://apimovil2.lightdata.app/api/users/change-password"],
        editUser: ["http://apimovil2.lightdata.app/api/users/edit-user"],
        changeProfilePicture: ["http://apimovil2.lightdata.app/api/users/change-profile-picture"],

        /// COLLECT MODULE
        collectGetRoute: ["http://apimovil2.lightdata.app/api/collect/get-collect-details"],
        collectStartRoute: ["http://apimovil2.lightdata.app/api/collect/start-route"],
        collectSaveRoute: ["http://apimovil2.lightdata.app/api/collect/save-route"],
        collectDetails: ["http://apimovil2.lightdata.app/api/collect/get-collect-details"],
        collectClientDetails: ["http://apimovil2.lightdata.app/api/collect/get-collect-details"],
        collectList: ["http://apimovil2.lightdata.app/api/collect/get-collect-list"],
        collectSettlementList: ["http://apimovil2.lightdata.app/api/collect/get-collect-details"],
        collectSettlementDetails: ["http://apimovil2.lightdata.app/api/collect/get-collect-details"],

        /// ACCOUNTS
        cuentas_listado: ["http://apimovil2.lightdata.app/api/accounts/account-list"],
        cuentas_alta: ["https://lightdata.app/g/instalation/responseDetalleCuenta.php"],

        /// BACKGPS
        backgps: ["https://backgps.lightdata.app/backgps"],

        /// WSP
        wsp: ["http://apimovil2.lightdata.app/api/auth/whatsapp-message-list"],

        /// PRIVACY POLICY
        privacyPolicy: ["https://lightdata.app/privacyapp.html"],
    };

    if (company != null && company.did == 4) {
        /// ASIGNACION PROCOURRIER
        urls.assignment = ["https://asignaciones.lightdata.app/api/asignaciones-procourrier/asignar"];
        urls.unassignment = ["https://asignaciones.lightdata.app/api/asignaciones-procourrier/desasignar"];
    }

    return urls;
}