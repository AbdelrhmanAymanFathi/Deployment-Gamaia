// models/index.js
const User = require('./user');
const { Association, UserAssociation } = require('./association');

// Define associations
Association.hasMany(UserAssociation);
UserAssociation.belongsTo(Association);

User.hasMany(UserAssociation);
UserAssociation.belongsTo(User);

// ✅ Add many-to-many relation with alias 'Associations'
User.belongsToMany(Association, {
  through: UserAssociation,
  as: 'Associations',
  foreignKey: 'UserId'
});

Association.belongsToMany(User, {
  through: UserAssociation,
  as: 'Users',
  foreignKey: 'AssociationId'
});

module.exports = {
  User,
  Association,
  UserAssociation
};
