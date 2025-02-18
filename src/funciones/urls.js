
export function getUrls(company) {
    const urls = {
        /// HOME
        home: ["http://localhost:13000/api/home/home"],
        startRoute: ["http://localhost:13000/api/home/start-route"],
        endRoute: ["http://localhost:13000/api/home/end-route"],
        verifyStartedRoute: ["http://localhost:13000/api/home/verify-started-route"],

        /// SHIPMENT-LIST
        shipmentList: ["http://localhost:13000/api/shipments/shipment-list"],
        shipmentDetails: ["http://localhost:13000/api/shipments/shipment-details"],
        saveImagen: ["http://localhost:13000/api/rutas/save-image"],
        registerVisit: ["https://registros.lightdatas2.com.ar/registrarVisita.php"],
        nextToDeliver: ["https://apimovil.lightdata.app/api/envios/proximaentrega.php"],

        /// SETTLEMENTS
        settlementList: ["http://localhost:13000/api/settlements/get-settlement-list"],
        settlementDetails: ["http://localhost:13000/api/settlements/get-settlement-details"],
        settlementShipmentDetails: ["http://localhost:13000/api/settlements/settlement-shipment-details"],

        /// MAP
        geolocalize: ["http://localhost:13000/api/map/geolocalize"],
        getRoute: ["http://localhost:13000/api/map/get-route-by-user"],
        saveRoute: ["http://localhost:13000/api/map/save-route"],

        /// QR
        driverList: ["http://localhost:13000/api/qr/driver-list"],
        readQr: ["http://localhost:13000/api/qr/get-shipment-id"],
        crossdocking: ["http://localhost:13000/api/qr/cross-docking"],
        enterFlex: ["http://localhost:13000/api/qr/enter-flex"],
        colecta: ["https://apimovil.lightdata.app/api/envios/colecta.php"],
        aplanta: ["https://apimovil.lightdata.app/api/envios/aplanta.php"],
        asignaciones: ["https://asignaciones.lightdatas2.com.ar/asignav3/asignar"],
        productsFromShipment: ["http://localhost:13000/api/qr/products-from-shipment"],

        /// PROFILE
        changePassword: ["http://localhost:13000/api/users/change-password"],
        editUser: ["http://localhost:13000/api/users/edit-user"],
        changeProfilePicture: ["http://localhost:13000/api/users/change-profile-picture"],

        /// COLLECT MODULE
        collectGetRoute: ["http://localhost:13000/api/collect/get-collect-details"],
        collectStartRoute: ["http://localhost:13000/api/collect/start-route"],
        collectSaveRoute: ["http://localhost:13000/api/collect/save-route"],
        collectDetails: ["http://localhost:13000/api/collect/get-collect-details"],
        collectClientDetails: ["http://localhost:13000/api/collect/get-collect-details"],
        collectList: ["http://localhost:13000/api/collect/get-collect-list"],
        collectSettlementList: ["http://localhost:13000/api/collect/get-collect-details"],
        collectSettlementDetails: ["http://localhost:13000/api/collect/get-collect-details"],

        /// ACCOUNTS
        cuentas_listado: ["http://localhost:13000/api/accounts/account-list"],
        cuentas_alta: ["https://lightdata.app/g/instalation/responseDetalleCuenta.php"],

        /// BACKGPS
        backgps: ["https://backgps.lightdata.app/backgps"],

        /// WSP
        wsp: ["http://localhost:13000/api/auth/whatsapp-message-list"],

        /// PRIVACY POLICY
        privacyPolicy: ["https://lightdata.app/privacyapp.html"],
    };

    if (company != null && company.did == 4) {
        /// ASIGNACION PROCOURRIER
        urls.asignaciones = ["https://asignaciones.lightdatas2.com.ar/asignaciones/procourrier/index.php"];
    }

    return urls;
}