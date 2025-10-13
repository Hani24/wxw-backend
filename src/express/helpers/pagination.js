// [PAGINATION]

const PAGINATION_OFFSET = 0;
const PAGINATION_LIMIT = 15;
const PAGINATION_ORDER = 'desc';
const PAGINATION_ORDER_BY = 'id';

const PAGINATION_ABS_LIMIT = 1000;

module.exports = function(req, res, next, App, helpenName=''){ 
  try{

    req.getPaginationDefaults = () => {
      return {
        offset: PAGINATION_OFFSET,
        limit: PAGINATION_LIMIT,
        order: PAGINATION_ORDER,
        by: PAGINATION_ORDER_BY,
      };
    }

    req.getPagination = ( {offset=0, limit=15, order='desc', by='id', hardLimit=false}={} ) => {

      const _query = (App.isObject(req.query) ? req.query : {});
      const _order = App.isString(_query.order) 
        ? _query.order.trim().toLowerCase() 
        : App.isString( order )
          ? order.trim().toLowerCase()
          : PAGINATION_ORDER;

      limit = App.isPosNumber( Math.abs(+_query.limit) ) 
        ? Math.abs((+_query.limit)) 
        : App.isPosNumber( Math.abs(+limit) ) 
          ? Math.abs((+limit)) 
          : PAGINATION_LIMIT;

      if( App.isPosNumber(hardLimit) && hardLimit < limit )
        limit = hardLimit;

      if( !App.isPosNumber(limit) )
        limit = PAGINATION_LIMIT;

      if( limit > PAGINATION_ABS_LIMIT )
        limit = PAGINATION_ABS_LIMIT;

      offset = App.isPosNumber( Math.abs(+_query.offset) ) 
        ? Math.abs((+_query.offset)) 
          : App.isPosNumber( Math.abs(+offset) ) 
            ? Math.abs((+offset)) 
            : PAGINATION_OFFSET;

      if( !App.isPosNumber(offset) )
        offset = PAGINATION_OFFSET;

      by = ( 
        App.isString(_query.by) && _query.by.trim().length 
          ? _query.by 
          : PAGINATION_ORDER_BY 
        ).replace(/[^\w\d\_\-]/g,'');

      return {
        offset: offset,
        limit: limit,
        order: (_order === 'desc' ? 'desc' : 'asc'),
        by,
      };
    }

    return next();

  }catch(e){
    return next();
    console.error(` #express.helper: [${helpenName}]: ${e.message} `);
  }
}
