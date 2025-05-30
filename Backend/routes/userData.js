const express = require('express');
const router = express.Router();
const { User, Association, UserAssociation } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const isAdmin = require('../middleware/admin');
const bcrypt = require('bcryptjs');


router.get('/wallet', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({error:'User not found'});
        }
        res.json({ walletBalance: user.walletBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({error:'Server error'});
    }
});

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'fullName', 'nationalId', 'phone', 'profileImage']
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/uploads/:file', auth, async (req, res) => {
    try {
        const { file } = req.params;
        res.sendFile(file, { 
            root: 'uploads'
         });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/admin/create-user', auth, isAdmin, async (req, res) => {
    const {
      fullName,
      nationalId,
      phone,
      address,
      role,
      password
    } = req.body;
  
    // Validation: all required fields must be present
    if (!fullName || !nationalId || !phone || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      // Check if phone or nationalId already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ phone }, { nationalId }]
        }
      });
  
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists with given phone or nationalId' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create the user
      const newUser = await User.create({
        fullName,
        nationalId,
        phone,
        address,
        role,
        password: hashedPassword
      });
  
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  router.get('/users', [auth, isAdmin], async (req, res) => {
    try {
      const users = await User.findAll();
      res.status(200).json(users);
    } catch (err) {
      console.error('Get all users error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

module.exports = router;