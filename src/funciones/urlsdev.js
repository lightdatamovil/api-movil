
export function getUrlsDev(company) {
    const urls = {
        /// HOME
        home: ["http://10.0.2.2:13000/api-test/home/home"],
        startRoute: ["http://10.0.2.2:13000/api-test/home/start-route"],
        endRoute: ["http://10.0.2.2:13000/api-test/home/end-route"],
        verifyStartedRoute: ["http://10.0.2.2:13000/api-test/home/verify-started-route"],

        /// SHIPMENT-LIST
        shipmentList: ["http://10.0.2.2:13000/api-test/shipments/shipment-list"],
        shipmentDetails: ["http://10.0.2.2:13000/api-test/shipments/shipment-details"],
        nextToDeliver: ["http://10.0.2.2:13000/api-test/shipments/next-visit"],

        registerVisit: ["http://10.0.2.2:13000/api-test/register-visit/register"],
        saveImage: ["http://10.0.2.2:13000/api-test/register-visit/upload-image"],

        /// SETTLEMENTS
        settlementList: ["http://10.0.2.2:13000/api-test/settlements/get-settlement-list"],
        settlementDetails: ["http://10.0.2.2:13000/api-test/settlements/get-settlement-details"],
        settlementShipmentDetails: ["http://10.0.2.2:13000/api-test/settlements/settlement-shipment-details"],

        /// MAP
        geolocalize: ["http://10.0.2.2:13000/api-test/map/geolocalize"],
        getRoute: ["http://10.0.2.2:13000/api-test/map/get-route-by-user"],
        saveRoute: ["http://10.0.2.2:13000/api-test/map/save-route"],

        /// QR
        driverList: ["http://10.0.2.2:13000/api-test/qr/driver-list"],
        readQr: ["http://10.0.2.2:13000/api-test/qr/get-shipment-id"],
        crossdocking: ["http://10.0.2.2:13000/api-test/qr/cross-docking"],
        enterFlex: ["http://10.0.2.2:13000/api-test/qr/enter-flex"],
        colecta: ["https://colecta.lightdata.app/api-test/colecta"],
        aplanta: ["https://aplanta.lightdata.app/api-test/aplanta"],
        assignment: ["https://asignaciones.lightdata.app/api-test/asignaciones/asignar"],
        unassignment: ["https://asignaciones.lightdata.app/api-test/asignaciones/desasignar"],
        productsFromShipment: ["http://10.0.2.2:13000/api-test/qr/products-from-shipment"],

        /// PROFILE
        changePassword: ["http://10.0.2.2:13000/api-test/users/change-password"],
        editUser: ["http://10.0.2.2:13000/api-test/users/edit-user"],
        changeProfilePicture: ["http://10.0.2.2:13000/api-test/users/change-profile-picture"],

        /// COLLECT MODULE
        collectGetRoute: ["http://10.0.2.2:13000/api-test/collect/get-collect-details"],
        collectStartRoute: ["http://10.0.2.2:13000/api-test/collect/start-route"],
        collectSaveRoute: ["http://10.0.2.2:13000/api-test/collect/save-route"],
        collectDetails: ["http://10.0.2.2:13000/api-test/collect/get-collect-details"],
        collectClientDetails: ["http://10.0.2.2:13000/api-test/collect/get-collect-details"],
        collectList: ["http://10.0.2.2:13000/api-test/collect/get-collect-list"],
        collectSettlementList: ["http://10.0.2.2:13000/api-test/collect/get-collect-details"],
        collectSettlementDetails: ["http://10.0.2.2:13000/api-test/collect/get-collect-details"],

        /// ACCOUNTS
        cuentas_listado: ["http://10.0.2.2:13000/api-test/accounts/account-list"],
        cuentas_alta: ["https://lightdata.app/g/instalation/responseDetalleCuenta.php"],

        /// BACKGPS
        backgps: ["https://backgps.lightdata.app/backgps"],

        /// WSP
        wsp: ["http://10.0.2.2:13000/api-test/auth/whatsapp-message-list"],

        /// PRIVACY POLICY
        privacyPolicy: ["https://lightdata.app/privacyapp.html"],
    };

    if (company != null && company.did == 4) {
        /// ASIGNACION PROCOURRIER
        urls.assignment = ["https://asignaciones.lightdata.app/api-test/asignaciones-procourrier/asignar"];
        urls.unassignment = ["https://asignaciones.lightdata.app/api-test/asignaciones-procourrier/desasignar"];
    }

    return urls;
}