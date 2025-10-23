const logger = require('mii-logger.js');

module.exports = async(App, params={})=>{

  const sequelize = App.DB.sequelize;

  const User = App.getModel('User');
  const Session = App.getModel('Session');
  const Upload = App.getModel('Upload');
  const AccessRecovery = App.getModel('AccessRecovery');
  const EmailVerification = App.getModel('EmailVerification');
  const SmsVerification = App.getModel('SmsVerification');

  const Client = App.getModel('Client');
  const Courier = App.getModel('Courier');
  const Manager = App.getModel('Manager');
  const Employee = App.getModel('Employee');

  const CourierShift = App.getModel('CourierShift');
  const CourierOrderRequest = App.getModel('CourierOrderRequest');
  const CourierWithdrawRequest = App.getModel('CourierWithdrawRequest');

  const Restaurant = App.getModel('Restaurant');
  const RestaurantWorkingTime = App.getModel('RestaurantWorkingTime');
  const MenuCategory = App.getModel('MenuCategory');
  const MenuItem = App.getModel('MenuItem');
  const DeliveryAddress = App.getModel('DeliveryAddress');
  const FavoriteMenuItem = App.getModel('FavoriteMenuItem');
  const PaymentCard = App.getModel('PaymentCard');
  const ClientPaymentSettings = App.getModel('ClientPaymentSettings');

  const Order = App.getModel('Order');
  const OrderSupplier = App.getModel('OrderSupplier');
  const OrderSupplierItem = App.getModel('OrderSupplierItem');

  const OrderPaymentType = App.getModel('OrderPaymentType');
  const OrderDeliveryAddress = App.getModel('OrderDeliveryAddress');
  const OrderDeliveryTime = App.getModel('OrderDeliveryTime');
  const OrderDeliveryType = App.getModel('OrderDeliveryType');
  const OrderOnSitePresenceDetails = App.getModel('OrderOnSitePresenceDetails');

  const RestaurantOrderTypeSettings = App.getModel('RestaurantOrderTypeSettings');
  const RestaurantUnavailableDates = App.getModel('RestaurantUnavailableDates');

  const Cart = App.getModel('Cart');
  const CartItem = App.getModel('CartItem');

  const State = App.getModel('State');
  const City = App.getModel('City');

  const CuisineType = App.getModel('CuisineType');

  const UserSettings = App.getModel('UserSettings');

  const ClientNotification = App.getModel('ClientNotification');
  const CourierNotification = App.getModel('CourierNotification');
  const RestaurantNotification = App.getModel('RestaurantNotification');

  const SupportTicket = App.getModel('SupportTicket');
  const SupportTicketFile = App.getModel('SupportTicketFile');

  const TermsAndConditions = App.getModel('TermsAndConditions');
  const TermsAndConditionsItem = App.getModel('TermsAndConditionsItem');

  const PrivacyPolicy = App.getModel('PrivacyPolicy');
  const PrivacyPolicyItem = App.getModel('PrivacyPolicyItem');

  const RestaurantTransfer = App.getModel('RestaurantTransfer');


  // [inner]
  // const ApiNode = App.getModel('ApiNode');
  // const MasterNode = App.getModel('MasterNode');

  // [common]
  Session.belongsTo(User, { foreignKey: 'userId' } );
  User.hasMany(Session, { foreignKey: 'userId' } );

  EmailVerification.belongsTo(User, { foreignKey: 'userId' } );
  User.hasMany(EmailVerification, { foreignKey: 'userId' } );

  AccessRecovery.belongsTo(User, { foreignKey: 'userId' } );
  User.hasMany(AccessRecovery, { foreignKey: 'userId' } );

  UserSettings.belongsTo(User, { foreignKey: 'userId' } );
  User.hasMany(UserSettings, { foreignKey: 'userId' } );

  SupportTicket.belongsTo(User, { foreignKey: 'userId' });
  User.hasMany(SupportTicket, { foreignKey: 'userId' } );
  SupportTicket.belongsTo(Order, { foreignKey: 'orderId' });
  Order.hasMany(SupportTicket, { foreignKey: 'orderId' } );

  SupportTicketFile.belongsTo(SupportTicket, { foreignKey: 'supportTicketId' });
  SupportTicket.hasMany(SupportTicketFile, { foreignKey: 'supportTicketId' } );
  SupportTicketFile.belongsTo(Upload, { foreignKey: 'fileId' });
  Upload.hasMany(SupportTicketFile, { foreignKey: 'fileId' } );

  User.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasOne(User, { foreignKey: 'restaurantId' } );

  Manager.belongsTo(User, { foreignKey: 'userId' } );
  User.hasOne(Manager, { foreignKey: 'userId' } );

  Employee.belongsTo(User, { foreignKey: 'userId' } );
  User.hasOne(Employee, { foreignKey: 'userId' } );

  TermsAndConditionsItem.belongsTo(TermsAndConditions, { foreignKey: 'termsAndConditionsId' } );
  TermsAndConditions.hasMany(TermsAndConditionsItem, { foreignKey: 'termsAndConditionsId' } );

  PrivacyPolicyItem.belongsTo(PrivacyPolicy, { foreignKey: 'privacyPolicyId' } );
  PrivacyPolicy.hasMany(PrivacyPolicyItem, { foreignKey: 'privacyPolicyId' } );

  // [restaurant]
  Restaurant.belongsTo(User, { foreignKey: 'userId' } );
  User.hasOne(Restaurant, { foreignKey: 'userId' } );

  MenuCategory.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(MenuCategory, { foreignKey: 'restaurantId' } );

  MenuItem.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(MenuItem, { foreignKey: 'restaurantId' } );
  MenuItem.belongsTo(MenuCategory, { foreignKey: 'menuCategoryId' } );
  MenuCategory.hasMany(MenuItem, { foreignKey: 'menuCategoryId' } );

  RestaurantWorkingTime.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasOne(RestaurantWorkingTime, { foreignKey: 'restaurantId' } );

  City.belongsTo(State, { foreignKey: 'stateId' } );
  State.hasMany(City, { foreignKey: 'stateId' } );

  Restaurant.belongsTo(City, { foreignKey: 'cityId' } );
  City.hasMany(Restaurant, { foreignKey: 'cityId' } );

  User.belongsTo(City, { foreignKey: 'cityId' } );
  City.hasOne(User, { foreignKey: 'cityId' } );

  RestaurantNotification.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(RestaurantNotification, { foreignKey: 'restaurantId' } );

  RestaurantTransfer.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(RestaurantTransfer, { foreignKey: 'restaurantId' } );

  // [restaurant-cuisine] Many-to-Many
  Restaurant.belongsToMany(CuisineType, {
    through: 'RestaurantCuisines',
    foreignKey: 'restaurantId',
    otherKey: 'cuisineTypeId'
  });
  CuisineType.belongsToMany(Restaurant, {
    through: 'RestaurantCuisines',
    foreignKey: 'cuisineTypeId',
    otherKey: 'restaurantId'
  });

  // [courier]
  Courier.belongsTo(User, { foreignKey: 'userId' } );
  User.hasOne(Courier, { foreignKey: 'userId' } );

  CourierShift.belongsTo(Courier, { foreignKey: 'courierId' } );
  Courier.hasMany(CourierShift, { foreignKey: 'courierId' } );

  CourierNotification.belongsTo(Courier, { foreignKey: 'courierId' } );
  Courier.hasMany(CourierNotification, { foreignKey: 'courierId' } );

  // TODO: verify
  // Order.belongsTo(Courier, { foreignKey: 'activeOrderId' } );
  // Courier.hasOne(Order, { foreignKey: 'activeOrderId' } );

  CourierOrderRequest.belongsTo(Courier, {foreignKey: 'courierId'});
  Courier.hasMany(CourierOrderRequest, {foreignKey: 'courierId'});
  CourierOrderRequest.belongsTo(Order, {foreignKey: 'orderId'});
  Order.hasMany(CourierOrderRequest, {foreignKey: 'orderId'});

  CourierWithdrawRequest.belongsTo(Courier, {foreignKey: 'courierId'});
  Courier.hasMany(CourierWithdrawRequest, {foreignKey: 'courierId'});

  // [client]
  Client.belongsTo(User, { foreignKey: 'userId' } );
  User.hasOne(Client, { foreignKey: 'userId' } );

  DeliveryAddress.belongsTo(Client, { foreignKey: 'clientId' } );
  Client.hasMany(DeliveryAddress, { foreignKey: 'clientId' } );

  DeliveryAddress.belongsTo(State, { foreignKey: 'stateId' } );
  State.hasMany(DeliveryAddress, { foreignKey: 'stateId' } );

  // DeliveryAddress.belongsTo(City, { foreignKey: 'cityId' } );
  // City.hasMany(DeliveryAddress, { foreignKey: 'cityId' } );

  PaymentCard.belongsTo(Client, { foreignKey: 'clientId' } );
  Client.hasMany(PaymentCard, { foreignKey: 'clientId' } );

  FavoriteMenuItem.belongsTo(Client, { foreignKey: 'clientId' } );
  Client.hasMany(FavoriteMenuItem, { foreignKey: 'clientId' } );
  FavoriteMenuItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' } );
  MenuItem.hasOne(FavoriteMenuItem, { foreignKey: 'menuItemId' } );

  ClientNotification.belongsTo(Client, { foreignKey: 'clientId' } );
  Client.hasMany(ClientNotification, { foreignKey: 'clientId' } );

  // [order]
  Order.belongsTo(Client, { foreignKey: 'clientId' } );
  Client.hasMany(Order, { foreignKey: 'clientId' } );
  Order.belongsTo(Courier, { foreignKey: 'courierId' } );
  Courier.hasMany(Order, { foreignKey: 'courierId' } );

  OrderSupplier.belongsTo(Order, { foreignKey: 'orderId' } );
  Order.hasMany(OrderSupplier, { foreignKey: 'orderId' } );
  OrderSupplier.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(OrderSupplier, { foreignKey: 'restaurantId' } );

  OrderSupplierItem.belongsTo(OrderSupplier, { foreignKey: 'orderSupplierId' } );
  OrderSupplier.hasMany(OrderSupplierItem, { foreignKey: 'orderSupplierId' } );
  OrderSupplierItem.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(OrderSupplierItem, { foreignKey: 'restaurantId' } );
  OrderSupplierItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' } );
  MenuItem.hasMany(OrderSupplierItem, { foreignKey: 'menuItemId' } );

  OrderPaymentType.belongsTo(Order, {foreignKey: 'orderId'});
  Order.hasOne(OrderPaymentType, {foreignKey: 'orderId'});
  OrderPaymentType.belongsTo(PaymentCard, {foreignKey: 'paymentCardId'});
  PaymentCard.hasOne(OrderPaymentType, {foreignKey: 'paymentCardId'});

  OrderDeliveryAddress.belongsTo(Order, {foreignKey: 'orderId'});
  Order.hasOne(OrderDeliveryAddress, {foreignKey: 'orderId'});
  OrderDeliveryAddress.belongsTo(DeliveryAddress, {foreignKey: 'deliveryAddressId'});
  DeliveryAddress.hasOne(OrderDeliveryAddress, {foreignKey: 'deliveryAddressId'});

  OrderDeliveryTime.belongsTo(Order, {foreignKey: 'orderId'});
  Order.hasOne(OrderDeliveryTime, {foreignKey: 'orderId'});

  OrderDeliveryType.belongsTo(Order, {foreignKey: 'orderId'});
  Order.hasOne(OrderDeliveryType, {foreignKey: 'orderId'});

  OrderOnSitePresenceDetails.belongsTo(Order, {foreignKey: 'orderId'});
  Order.hasOne(OrderOnSitePresenceDetails, {foreignKey: 'orderId'});

  RestaurantOrderTypeSettings.belongsTo(Restaurant, {foreignKey: 'restaurantId'});
  Restaurant.hasMany(RestaurantOrderTypeSettings, {foreignKey: 'restaurantId'});

  RestaurantUnavailableDates.belongsTo(Restaurant, {foreignKey: 'restaurantId'});
  Restaurant.hasMany(RestaurantUnavailableDates, {foreignKey: 'restaurantId'});

  ClientPaymentSettings.belongsTo(User, { foreignKey: 'clientId' } );
  User.hasMany(ClientPaymentSettings, { foreignKey: 'clientId' } );
  ClientPaymentSettings.belongsTo(PaymentCard, { foreignKey: 'paymentCardId' } );
  PaymentCard.hasOne(ClientPaymentSettings, { foreignKey: 'paymentCardId' } );

  // [cart]
  Cart.belongsTo(Client, { foreignKey: 'clientId' } );
  Client.hasOne(Cart, { foreignKey: 'clientId' } );

  CartItem.belongsTo(Cart, { foreignKey: 'cartId' } );
  Cart.hasMany(CartItem, { foreignKey: 'cartId' } );
  CartItem.belongsTo(Restaurant, { foreignKey: 'restaurantId' } );
  Restaurant.hasMany(CartItem, { foreignKey: 'restaurantId' } );
  CartItem.belongsTo(MenuItem, { foreignKey: 'menuItemId' } );
  MenuItem.hasMany(CartItem, { foreignKey: 'menuItemId' } );


  // for( const modelName of Object.keys(App.DB.models) ){
  //   // console.debug({modelName});
  //   const syncRes = await App.getModel( modelName )
  //     .sync({force: false});
  //   // console.debug('done');
  // }

}