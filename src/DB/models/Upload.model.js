const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const UPLOAD_TYPES = App.getDictByName('UPLOAD_TYPES');

  const Model = sequelize.define( exportModelWithName, {
    userId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id'
      },
    },
    fileType: {
      type: Sequelize.ENUM, required: true, values: UPLOAD_TYPES,
      defaultValue: UPLOAD_TYPES[ 0 ],
    },
    fileName: {
      type: Sequelize.STRING, allowNull: false,
      get(){
        return App.S3.getUrlByName( this.getDataValue('fileName') );
      },
      set(image_t){
        this.setDataValue('fileName', !App.isString(image_t)
          ? ''
          : image_t.split('/').length >= 3
            ? image_t.split('/').pop().trim()
            : image_t
        );
      },
    },
    fileSize: {
      type: DataTypes.INTEGER(11).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    fileMimeType: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
  });

  Model.getUPloadTypes = function ({asArray=false}={}) {
    return Model._mapDict(UPLOAD_TYPES, {asArray} );
  };

  return Model;

}
