const express=require("express");
const router=express.Router();
const {requireSignin,isAuth}=require("../controllers/auth");
const {userById}=require("../controllers/user");
const {processPayment,verification}=require("../controllers/razorpay");
router.post(
    "/razorpay/:userId",
    requireSignin,
    isAuth,
    processPayment
);
router.post(
    "/verification",
    verification
);

router.param("userId",userById);


module.exports=router;
