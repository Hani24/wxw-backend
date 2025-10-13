
module.exports = (App, Model)=>{

  Model.getById = async function (id) { return await Model.findOne({ where: { id } }); };
  Model.getAll = async function () { return await Model.findAll({}); };
  Model.getByFields = async function (where) { return await Model.findOne({ where }); };
  Model.getAllByFields = async function (where) { return await Model.findAll({ where }); };
  Model.getTotal = async function () { return await Model.count({}); };
  Model.getTotalWhere = async function (where) { return await Model.count({ where }); };
  Model.isset = async function (where) { return !!(await Model.count({ where })); };
  Model.getOrderBy = function (by=null) {
    const sortableBy = Object.keys(Model.tableAttributes);
    if( App.isNull(by) ) sortableBy;
    return sortableBy.includes( by ) ? by : 'id';
  };

  Model.getChecksum = function( mModel ){

    const arrayData = [];
    const ChecksumKeys = App.isFunction(Model.getChecksumKeys)
      ? Model.getChecksumKeys()
      : ['id'];

    for( const mKey of ChecksumKeys ){
      const mValue = mModel.getDataValue(mKey);
      // console.log({mKey,mValue});
      arrayData.push( mValue === null ? '' : mValue.toString() );
    }

    // arrayData.push( App.DT.moment(mModel.createdAt).format( App.getDateFormat() ) );
    arrayData.push( App.getEnv('JWT_SECRET_KEY') );
    const rawData = arrayData.join(',');
    const hashRes = App.RSA.sha256( rawData );
    if( !hashRes.success ){
      console.error(`#getChecksum: ${hashRes.message}`);
      console.debug({rawData});
      return false;
    }
    const hash = hashRes.data.hash.substr(0,(256/4)-1);
    if( App.isEnv('dev') ){
      console.warn({rawData});
      console.warn({hash});      
    }
    return hash;
  }

  Model.getMaxSizeOf = function(fieldName){
    if( ! Object.keys(Model.tableAttributes).includes( fieldName ))
      return 0;
    const mColumn = Model.tableAttributes[ fieldName ];
    const mType = mColumn.type;
    // console.json({ mColumn, mType });
    if( !App.isObject(mType) )
      return 0;
    const type = mType.toString();
    const mLimit = App.DB.dataLimits[ type ];
    return mLimit;
  }

  Model.getIdsWhere = async function ( where={}, { offset=0, limit=15, order='desc' }={}) {
    const mIds = await Model.findAll({
      where,
      attributes: ['id'],
      order: [['id', order]],
      offset,
      limit,
    });
    return mIds;
  };

  Model.getIds = async function ({ offset=0, limit=15, order='desc' }={}) {
    return await Model.getIdsWhere({}, {offset, limit, order});
  };

  Model._mapDict = function ( DICT, {asArray=false}={}) {
    if( asArray ) return [ ...DICT ];
    const object_t = {};
    DICT.map((key)=>{ object_t[ key ] = key; });
    return object_t;
  };

};
