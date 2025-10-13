// https://stripe.com/docs/api/cards/create?lang=node
module.exports = FullCard = class FullCard{

  static parse( App, cardInfo={} ){

    try{

      const card_t = {
        object: 'card', // required: <string>

        name: (App.isString(cardInfo.name) ? cardInfo.name : null),
        number: (App.isString(cardInfo.number) ? cardInfo.number : null),
        exp_month: (App.isString(cardInfo.exp_month) ? cardInfo.exp_month : null),
        exp_year: (App.isString(cardInfo.exp_year) ? cardInfo.exp_year : null),
        cvc: (App.isString(cardInfo.cvc) ? cardInfo.cvc : null),
        currency: (App.isString(cardInfo.cvc) ? cardInfo.cvc : null), // 'eur', // 'usd' | 'eur',

        address_line1: (App.isString(cardInfo.address_line1) ? cardInfo.address_line1 : null),
        address_line2: (App.isString(cardInfo.address_line2) ? cardInfo.address_line2 : null),
        address_city: (App.isString(cardInfo.address_city) ? cardInfo.address_city : null),
        address_state: (App.isString(cardInfo.address_state) ? cardInfo.address_state : null),
        address_zip: (App.isString(cardInfo.address_zip) ? cardInfo.address_zip : null),
        address_country: (App.isString(cardInfo.address_country) ? cardInfo.address_country : null),
      };

      for( const mKey of Object.keys(card_t) )
        if( App.isNull(card_t[ mKey ]) )
          delete card_t[ mKey ];

      if( !card_t.name )
        return {success: false, message: 'FullCard owner full-name is required', data: {}};

      if( !card_t.number )
        return {success: false, message: 'FullCard number is required', data: {}};

      card_t.number = App.tools.cleanCardNumber( card_t.number );
      if( !card_t.number )
        return {success: false, message: 'FullCard number is not valid', data: {}};

      if( !card_t.exp_month || !card_t.exp_year )
        return {success: false, message: 'FullCard exp-date is required', data: {}};

      const mDate = App.getDetailedDate();
      const expiryDate = [ card_t.exp_month, card_t.exp_year ];

      if(
        (expiryDate[1] < mDate.y)
        ||
        (expiryDate[1] == mDate.y && expiryDate[0] < mDate.M )
      ){
        return {success: false, message: 'FullCard has-been expired', data: {}};
      }

      // card_t.cvc = App.tools.cleanCardCVV( card_t.cvc );
      // if( !card_t.cvc )
      //   return {success: false, message: 'FullCard CVC/CVV is not valid', data: {}};

      if( !card_t.currency )
        card_t.currency = 'usd';

      return {success: true, message: 'OK', data: card_t};

    }catch(e){
      console.warn(` #stripe:FullCard: ${e.message}`);
      console.error(e.stack);
      return {success: false, message: 'Failed to parse FullCard', data: {}}
    }

  }

}