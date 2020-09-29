const express=require("express");
const router=express.Router();
const {requireSignin,isAuth}=require("../controllers/auth");
const {userById}=require("../controllers/user");
const {processPayment}=require("../controllers/razorpay");
router.post(
    "/razorpay/payment/:userId",
    requireSignin,
    isAuth,
    processPayment
);

router.param("userId",userById);


module.exports=router;
