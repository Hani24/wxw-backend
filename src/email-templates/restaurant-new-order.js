
module.exports = async ( mMailer, { mOrder, mOrderSupplier, lang='en' }={})=>{

  const App = mMailer.App;
  const UI_RESTAURANT_PROTODOMAIN = App.getEnv('UI_RESTAURANT_PROTODOMAIN');
  const UI_ADMIN_PANEL_PROTODOMAIN = App.getEnv('UI_ADMIN_PANEL_PROTODOMAIN');
  // const mOrderSupplier = mOrder.OrderSuppliers[0];

  let itemsList = '';
  for( const mOrderSupplierItem of mOrderSupplier.OrderSupplierItems ){
    itemsList += App.Mailer.templates.createPartial('menu-items', 'order-item', {}, {
      id: mOrderSupplierItem.MenuItem.id,
      name: mOrderSupplierItem.MenuItem.name,
      image: mOrderSupplierItem.MenuItem.image,
      price: mOrderSupplierItem.price, 
      amount: mOrderSupplierItem.amount, 
      totalPrice: mOrderSupplierItem.totalPrice,
    });
  }

  const body = App.Mailer.templates.createPartial('menu-items', 'order-block', {}, {
    orderId: App.t(['Order',`#${mOrder.id}`], lang),
    date: App.toHumanDatetime(mOrder.createdAt),
    itemsList,
    totalPrice: mOrderSupplier.totalPrice,
    totalItems: mOrderSupplier.totalItems,
    button: App.Mailer.button( App.t(['Show orders'], lang), `${UI_RESTAURANT_PROTODOMAIN}/new-orders/`, false, false ),
  });

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t(['New order received'], lang) }`, 
      body: body,
    }
  });

}

