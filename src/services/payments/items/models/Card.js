module.exports = Card = class Card{

  static parse( App, cardInfo={} ){

    try{

      const card_t = {
        // name: (App.isString(cardInfo.name) ? cardInfo.name : null),
        number: (App.isString(cardInfo.number) ? cardInfo.number : null),
        exp_month: (App.isString(cardInfo.exp_month) ? cardInfo.exp_month : null),
        exp_year: (App.isString(cardInfo.exp_year) ? cardInfo.exp_year : null),
        cvc: (App.isString(cardInfo.cvc) ? cardInfo.cvc : null),
      };

      for( const mKey of Object.keys(card_t) )
        if( App.isNull(card_t[ mKey ]) )
          delete card_t[ mKey ];

      // if( !card_t.name )
      //   return {success: false, message: 'Card owner full-name is required', data: {}};

      if( !card_t.number )
        return {success: false, message: 'Card number is required', data: {}};

      card_t.number = App.tools.cleanCardNumber( card_t.number );
      if( !card_t.number )
        return {success: false, message: 'Card number is not valid', data: {}};

      if( !card_t.exp_month || !card_t.exp_year )
        return {success: false, message: 'Card exp-date is required', data: {}};

      const mDate = App.getDetailedDate();
      const expiryDate = [ card_t.exp_month, card_t.exp_year ];

      if( !App.tools.cleanCardExpiryDate(`${expiryDate[0]}/${expiryDate[1]}`) )
        return {success: false, message: 'Card exp-date is not valid', data: {
          expected: `format: month/year, eg: 02/32`
        }};

      if( !App.tools.cleanCardCVV(card_t.cvc) )
        return {success: false, message: 'Card CVC is not valid', data: {
          expected: `format: 000, eg: 123`
        }};

      if(
        (expiryDate[1] < mDate.y)
        ||
        (expiryDate[1] == mDate.y && expiryDate[0] < mDate.M )
      ){
        return {success: false, message: 'Card has-been expired', data: {}};
      }

      // card_t.cvc = App.tools.cleanCardCVV( card_t.cvc );
      // if( !card_t.cvc )
      //   return {success: false, message: 'Card CVC/CVV is not valid', data: {}};

      return {success: true, message: 'OK', data: card_t};

    }catch(e){
      console.warn(` #stripe:Card: ${e.message}`);
      console.error(e.stack);
      return {success: false, message: 'Failed to parse Card', data: {}}
    }

  }

}