
export function getUrlsDev(companyId) {
    const urls = {
        /// HOME
        home: ["http://10.0.2.2:13500/api/home/home"],
        startRoute: ["http://10.0.2.2:13500/api/home/start-route"],
        endRoute: ["http://10.0.2.2:13500/api/home/end-route"],
        verifyStartedRoute: ["http://10.0.2.2:13500/api/home/verify-started-route"],

        /// SHIPMENT-LIST
        shipmentList: ["http://10.0.2.2:13500/api/shipments/shipment-list"],
        shipmentDetails: ["http://10.0.2.2:13500/api/shipments/shipment-details"],
        nextToDeliver: ["http://10.0.2.2:13500/api/shipments/next-visit"],

        registerVisit: ["http://10.0.2.2:13500/api/register-visit/register"],
        saveImage: ["http://10.0.2.2:13500/api/register-visit/upload-image"],

        /// SETTLEMENTS
        settlementList: ["http://10.0.2.2:13500/api/settlements/get-settlement-list"],
        settlementDetails: ["http://10.0.2.2:13500/api/settlements/get-settlement-details"],
        settlementShipmentDetails: ["http://10.0.2.2:13500/api/settlements/settlement-shipment-details"],

        /// MAP
        geolocalize: ["http://10.0.2.2:13500/api/map/geolocalize"],
        getRoute: ["http://10.0.2.2:13500/api/map/get-route-by-user"],
        saveRoute: ["http://10.0.2.2:13500/api/map/save-route"],

        /// QR
        driverList: ["http://10.0.2.2:13500/api/qr/driver-list"],
        readQr: ["http://10.0.2.2:13500/api/qr/get-shipment-id"],
        crossdocking: ["http://10.0.2.2:13500/api/qr/cross-docking"],
        enterFlex: ["http://10.0.2.2:13500/api/qr/enter-flex"],
        colecta: ["https://colecta.lightdata.app/api/colecta"],
        aplanta: ["https://aplanta.lightdata.app/api/aplanta"],
        assignment: ["https://asignaciones.lightdata.app/api/asignaciones/asignar"],
        unassignment: ["https://asignaciones.lightdata.app/api/asignaciones/desasignar"],
        productsFromShipment: ["http://10.0.2.2:13500/api/qr/products-from-shipment"],

        /// PROFILE
        changePassword: ["http://10.0.2.2:13500/api/users/change-password"],
        editUser: ["http://10.0.2.2:13500/api/users/edit-user"],
        changeProfilePicture: ["http://10.0.2.2:13500/api/users/change-profile-picture"],

        /// COLLECT MODULE
        collectGetRoute: ["http://10.0.2.2:13500/api/collect/get-collect-details"],
        collectStartRoute: ["http://10.0.2.2:13500/api/collect/start-route"],
        collectSaveRoute: ["http://10.0.2.2:13500/api/collect/save-route"],
        collectDetails: ["http://10.0.2.2:13500/api/collect/get-collect-details"],
        collectClientDetails: ["http://10.0.2.2:13500/api/collect/get-collect-details"],
        collectList: ["http://10.0.2.2:13500/api/collect/get-collect-list"],
        collectSettlementList: ["http://10.0.2.2:13500/api/collect/get-collect-details"],
        collectSettlementDetails: ["http://10.0.2.2:13500/api/collect/get-collect-details"],

        /// ACCOUNTS
        cuentas_listado: ["http://10.0.2.2:13500/api/accounts/account-list"],
        cuentas_alta: ["https://lightdata.app/g/instalation/responseDetalleCuenta.php"],

        /// BACKGPS
        backgps: ["https://backgps.lightdata.app/backgps"],

        /// WSP
        wsp: ["http://10.0.2.2:13500/api/auth/whatsapp-message-list"],

        /// PRIVACY POLICY
        privacyPolicy: ["https://lightdata.app/privacyapp.html"],
    };

    if (companyId == 4) {
        /// ASIGNACION PROCOURRIER
        urls.assignment = ["https://asignaciones.lightdata.app/api/asignaciones-procourrier/asignar"];
        urls.unassignment = ["https://asignaciones.lightdata.app/api/asignaciones-procourrier/desasignar"];
    }

    return urls;
}