const cron = require('node-cron');
const { UserAssociation } = require('../models/user');
const { Association } = require('../models/association');
const sequelize = require('../config/db');

cron.schedule('0 0 1 * *', async () => { // Runs on the first day of each month
  const transaction = await sequelize.transaction();
  
  try {
    const associations = await Association.findAll({
      where: { status: 'active' },
      transaction
    });
    
    for (const association of associations) {
      const members = await UserAssociation.findAll({
        where: { 
          associationId: association.id,
          status: 'active'
        },
        order: [['joinDate', 'ASC']],
        transaction
      });
      
      // Check if all members have received their turn
      const allReceived = members.every(m => m.hasReceived);
      if (allReceived) {
        await association.update({ status: 'completed' }, { transaction });
        continue;
      }
      
      // Find the next member who hasn't received their turn
      const nextMember = members.find(m => !m.hasReceived);
      
      if (nextMember) {
        const total = association.monthlyAmount * members.length;
        
        // Update member's wallet balance
        await sequelize.models.User.increment('walletBalance', {
          by: total,
          where: { id: nextMember.userId },
          transaction
        });
        
        // Mark member as having received their turn
        await nextMember.update({ 
          hasReceived: true,
          lastReceivedDate: new Date()
        }, { transaction });
        
        // Check if this was the last member
        const remainingMembers = members.filter(m => !m.hasReceived).length;
        if (remainingMembers === 1) {
          await association.update({ status: 'completed' }, { transaction });
        }
      }
    }
    
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error in ROSCA distribution:', error);
  }
});

// Get members of an association with their payout info
router.get('/:id/members', async (req, res) => {
  try {
    const associationId = req.params.id;

    const members = await UserAssociation.findAll({
      where: { AssociationId: associationId },
      include: [{
        model: User,
        attributes: ['id', 'fullName', 'phone']
      }],
      order: [['turnNumber', 'ASC']]
    });

    const result = members.map(member => ({
      userId: member.User.id,
      name: member.User.fullName,
      phone: member.User.phone,
      hasReceived: member.hasReceived,
      turnNumber: member.turnNumber,
      lastReceivedDate: member.lastReceivedDate
    }));

    res.json({ success: true, data: result });

  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;