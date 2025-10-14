const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '',
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
      get(){
        const image = this.getDataValue('image');
        return image ? App.S3.getUrlByName(image) : '';
      },
      set(image_t){
        this.setDataValue('image', !App.isString(image_t)
          ? ''
          : image_t.split('/').length >= 3
            ? image_t.split('/').pop().trim()
            : image_t
        );
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    order: {
      type: DataTypes.INTEGER(4).UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  });

  // Static methods
  Model.getAllActive = async function({asArray = false} = {}) {
    const cuisineTypes = await Model.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['name', 'ASC']],
    });

    if (asArray) {
      return cuisineTypes.map(ct => ({
        id: ct.id,
        name: ct.name,
        slug: ct.slug,
        image: ct.image,
      }));
    }

    return cuisineTypes;
  };

  Model.getBySlug = async function(slug) {
    if (!App.isString(slug) || !slug.length) return null;
    return await Model.findOne({
      where: { slug, isActive: true },
    });
  };

  Model.getById = async function(id) {
    if (!App.isPosNumber(Math.floor((+id)))) return null;
    return await Model.findOne({
      where: { id: Math.floor((+id)) },
    });
  };

  return Model;

};
