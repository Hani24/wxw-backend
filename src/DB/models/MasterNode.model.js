const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    nuid: {
      type: DataTypes.STRING, allowNull: false, unique: true, required: true,
    },
    ip: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    lastSeenAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
      // get(){
      //   return App.DT.moment( this.getDataValue('lastSeenAt') )
      //     .format( App.getDateFormat(false) );
      // },
      // set(){
      //   this.setDataValue('lastSeenAt', App.getISODate(true));
      // }
    },
    isLocked: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    lockedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },

    // createdAt: {
    //   type: DataTypes.DATE, 
    //   allowNull: false, defaultValue: DataTypes.NOW
    // },
    // updatedAt: {
    //   type: DataTypes.DATE, 
    //   allowNull: false, defaultValue: DataTypes.NOW,
    // },

  },{
    // timestamps: false
  });

  Model.isValidNodeNuid = function ( nuid ){
    return ( !!(App.isString(nuid)?nuid:'').match(/^[0-9a-f]{24}$/i) );
  }

  Model.getNodeByNuid = async function (nuid) {

    if( !Model.isValidNodeNuid(nuid) ){
      console.error(` #getNodeByNuid: nuid: [${nuid}]: is not valid`);
      return null; 
    }

    // (await Model.isset({nuid}))
    const mMasterNode = await Model.findOne({
      where: {
        nuid,
        isDeleted: false,
        isLocked: false,
      },
      // attributes: [],
    });

    return (App.isObject(mMasterNode) && App.isPosNumber(mMasterNode.id))
      ? mMasterNode
      : await Model.create({
          nuid,
          lastSeenAt: App.getISODate(),
        });

    // try{
    //   const tx = await App.DB.transaction( App.DB.getTxOptions() );
    //   const mMasterNode = await App.getModel('MasterNode').findOne({
    //     where: {
    //       nuid,
    //     },
    //     // attributes: [
    //     // ],
    //     transaction: tx,
    //     lock: tx.LOCK.UPDATE,
    //   });
    //   // const date_t = App.DT.moment().subtract('1', 'days').format( App.getDateFormat() ); 
    //   // createdAt: { [ App.DB.Op.gte ]: date_t },
    // }catch(e){
    //   console.error(` #getNodeByNuid: nuid: [${nuid}]: ${e.message}`);
    //   return null; 
    // }

  };

  return Model;

}
