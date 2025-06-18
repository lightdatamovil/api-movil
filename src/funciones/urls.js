export function getUrls(company) {
  const urls = {
    /// HOME
    home: ["http://api-testmovil2.lightdata.app/api-test/home/home"],
    startRoute: ["http://api-testmovil2.lightdata.app/api-test/home/start-route"],
    endRoute: ["http://api-testmovil2.lightdata.app/api-test/home/end-route"],
    verifyStartedRoute: [
      "http://api-testmovil2.lightdata.app/api-test/home/verify-started-route",
    ],

    /// SHIPMENT-LIST
    shipmentList: [
      "http://api-testmovil2.lightdata.app/api-test/shipments/shipment-list",
    ],
    shipmentDetails: [
      "http://api-testmovil2.lightdata.app/api-test/shipments/shipment-details",
    ],
    nextToDeliver: ["http://api-testmovil2.lightdata.app/api-test/shipments/next-visit"],

    registerVisit: [
      "http://api-testmovil2.lightdata.app/api-test/register-visit/register",
    ],
    saveImage: [
      "http://api-testmovil2.lightdata.app/api-test/register-visit/upload-image",
    ],

    /// SETTLEMENTS
    settlementList: [
      "http://api-testmovil2.lightdata.app/api-test/settlements/get-settlement-list",
    ],
    settlementDetails: [
      "http://api-testmovil2.lightdata.app/api-test/settlements/get-settlement-details",
    ],
    settlementShipmentDetails: [
      "http://api-testmovil2.lightdata.app/api-test/settlements/settlement-shipment-details",
    ],

    /// MAP
    geolocalize: ["http://api-testmovil2.lightdata.app/api-test/map/geolocalize"],
    getRoute: ["http://api-testmovil2.lightdata.app/api-test/map/get-route-by-user"],
    saveRoute: ["http://api-testmovil2.lightdata.app/api-test/map/save-route"],

    /// QR
    driverList: ["http://api-testmovil2.lightdata.app/api-test/qr/driver-list"],
    readQr: ["http://api-testmovil2.lightdata.app/api-test/qr/get-shipment-id"],
    crossdocking: ["http://api-testmovil2.lightdata.app/api-test/qr/cross-docking"],
    enterFlex: ["http://api-testmovil2.lightdata.app/api-test/qr/enter-flex"],
    colecta: ["https://colecta.lightdata.app/api-test/colecta"],
    aplanta: ["https://aplanta.lightdata.app/api-test/aplanta"],
    assignment: ["https://asignaciones.lightdata.app/api-test/asignaciones/asignar"],
    unassignment: [
      "https://asignaciones.lightdata.app/api-test/asignaciones/desasignar",
    ],
    productsFromShipment: [
      "http://api-testmovil2.lightdata.app/api-test/qr/products-from-shipment",
    ],

    /// PROFILE
    changePassword: [
      "http://api-testmovil2.lightdata.app/api-test/users/change-password",
    ],
    editUser: ["http://api-testmovil2.lightdata.app/api-test/users/edit-user"],
    changeProfilePicture: [
      "http://api-testmovil2.lightdata.app/api-test/users/change-profile-picture",
    ],

    /// COLLECT MODULE
    collectGetRoute: [
      "http://api-testmovil2.lightdata.app/api-test/collect/get-collect-details",
    ],
    collectStartRoute: [
      "http://api-testmovil2.lightdata.app/api-test/collect/start-route",
    ],
    collectSaveRoute: ["http://api-testmovil2.lightdata.app/api-test/collect/save-route"],
    collectDetails: [
      "http://api-testmovil2.lightdata.app/api-test/collect/get-collect-details",
    ],
    collectClientDetails: [
      "http://api-testmovil2.lightdata.app/api-test/collect/get-collect-details",
    ],
    collectList: [
      "http://api-testmovil2.lightdata.app/api-test/collect/get-collect-list",
    ],
    collectSettlementList: [
      "http://api-testmovil2.lightdata.app/api-test/collect/get-collect-details",
    ],
    collectSettlementDetails: [
      "http://api-testmovil2.lightdata.app/api-test/collect/get-collect-details",
    ],

    /// ACCOUNTS
    cuentas_listado: [
      "http://api-testmovil2.lightdata.app/api-test/accounts/account-list",
    ],
    cuentas_alta: [
      "https://lightdata.app/g/instalation/responseDetalleCuenta.php",
    ],

    /// BACKGPS
    backgps: ["https://backgps.lightdata.app/backgps"],

    /// WSP
    wsp: ["http://api-testmovil2.lightdata.app/api-test/auth/whatsapp-message-list"],

    /// PRIVACY POLICY
    privacyPolicy: ["https://lightdata.app/privacyapp.html"],
  };

  return urls;
}
