const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    sectionTitle: {
      type: DataTypes.STRING, allowNull: false, defaultValue: 'Terms and conditions'
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.getLatest = async function ( {offset=0,limit=15,order='desc',orderBy='id'}={} ) {

    if( !(await Model.isset({ isDeleted: false })) )
      await Model.create({});

    return await Model.findOne({
      where: {
        isDeleted: false,
      },
      attributes: {exclude: ['isDeleted','deletedAt','createdAt','updatedAt']},
      include: [{
        required: false,
        model: App.getModel(`${exportModelWithName}Item`),
        where: {
          isDeleted: false,
        },
        attributes: {exclude: ['termsAndConditionsId','isDeleted','deletedAt','createdAt','updatedAt']},
        offset,
        limit,
        order: [[ orderBy, order ]],
      }],
    });

  }

  return Model;

}
