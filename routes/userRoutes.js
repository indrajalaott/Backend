const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const {userAuth}=require('../middleware/userAuth');



// register and login routes

router.post('/register',userController.register);                                 //Tested
router.post('/login',userController.login)                                        //Tested 

//Fetch Movie Details
router.get('/movie/:url', userController.getIndividualMovieDetails);


module.exports = router