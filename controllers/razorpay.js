const  User=require("../models/user");
const Razorpay=require("razorpay");
const shortid = require('shortid');
require("dotenv").config();

var razorpay=new Razorpay({
key_id:process.env.RAZORPAY_API_KEY,
key_secret:process.env.RAZORPAY_KEY_SECRET
});

exports.processPayment=async(req,res)=>{
	const payment_capture = 1
	const currency = 'INR'
  const amount=req.body.amount;

	const options = {
		amount:amount*100,
		currency,
		receipt: shortid.generate(),
		payment_capture
	}

	try {
		const response = await razorpay.orders.create(options)
		console.log(response)
		res.json({
			id: response.id,
			currency: response.currency,
			amount: response.amount
		})
	} catch (error) {
		console.log(error)
	}
}

exports.verification=(req,res)=>{
	const secret=process.env.RAZORPAY_WEB_HOOK_SECRET;
	console.log(req.body);
	const crypto = require('crypto')

	const shasum = crypto.createHmac('sha256', secret)
	shasum.update(JSON.stringify(req.body))
	const digest = shasum.digest('hex')

	console.log(digest, req.headers['x-razorpay-signature'])

	if (digest === req.headers['x-razorpay-signature']) {
		console.log('request is legit')
		// process it
		require('fs').writeFileSync('payment1.json', JSON.stringify(req.body, null, 4))
	} else {
		// pass it
	}
	res.json({status:'ok'});
}
