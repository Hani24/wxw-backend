module.exports = [
  'client',      // main client of the app
  'courier',     // delivery service worker (managed by app-admin)
  'restaurant',  // head user/owner of restaraunt account
  'employee',    // common restaurant worker (only manage orders + change own password)
  'manager',     // main restaurant manager ( can manage menu, view analytics, manage restaurant itself and manage employees; )
  'admin',       // main App-Admin, handles new requests from new couriers && restaurants
  'root',        // super-user: system-wide
];
