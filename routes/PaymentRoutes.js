const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const {userAuth}=require('../middleware/userAuth');



// register and login routes

router.post('/phonepe',userAuth,userController.register);                                 //Tested


module.exports = router