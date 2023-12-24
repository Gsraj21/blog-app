const express = require('express');
const authMiddleware = require('../../middlewares/auth/authMiddleware');
const { sendEmailMsgCtrl } = require('../../controllers/Email/emailMsgCtrl');
const emailRoutes = express.Router();

emailRoutes.post('/',authMiddleware,sendEmailMsgCtrl);

module.exports = emailRoutes