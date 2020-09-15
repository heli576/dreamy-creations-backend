const formidable=require("formidable");
const _=require("lodash");
const fs=require("fs");
const {errorHandler}=require("../helpers/dbErrorHandler");
const Product=require("../models/product");

exports.productById=(req,res,next,id)=>{
  Product.findById(id).exec((err,product)=>{
    if(err||!product){
      return res.status(400).json({error:"Product not found"});
    }
    req.product=product;
    next();
  });
};

exports.read=(req,res)=>{
  req.product.media=undefined;
  return res.json(req.product);
}

exports.create=(req,res)=>{
let form=new formidable.IncomingForm()
form.keepExtensions=true;
form.parse(req,(err,fields,files)=>{
  if(err){
    return res.status(400).json({error:"Media has exceeded the size"});
  }
//check for all fields
  const {name,description,price,category}=fields;
  if(!name||!description||!price||!category){
    return res.status(400).json({error:"All fields are required"});
  }
  let product=new Product(fields);
  if(files.media){
    if(files.media.size>12000000){
        return res.status(400).json({error:"Media could not be uploaded"});
    }
    product.media.data=fs.readFileSync(files.media.path)
    product.media.contentType=files.media.type
  }
  product.save((err,result)=>{
    if(err){
      return res.status(400).json({error:"Product already created"})
    }
    res.json(result);
  })
})
};

exports.update=(req,res)=>{
  let form=new formidable.IncomingForm()
  form.keepExtensions=true
  form.parse(req,(err,fields,files)=>{
    if(err){
      return res.status(400).json({error:"Media has exceeded the size"});
    }
  //check for all fields
    const {name,description,price,category,shipping}=fields;
    if(!name||!description||!price||!category||!shipping){
      return res.status(400).json({error:"All fields are required"});
    }
    let product=req.product;
    product=_.extend(product,fields)
    if(files.media){
      if(files.media.size>12000000){
          return res.status(400).json({error:"Media could not be uploaded"});
      }
      product.media.data=fs.readFileSync(files.media.path)
      product.media.contentType=files.media.type
    }
    product.save((err,result)=>{
      if(err){
        return res.status(400).json({error:errorHandler(err)})
      }
      res.json(result);
    })
  })
};

exports.remove=(req,res)=>{
  let product=req.product;
  product.remove((err,deletedProduct)=>{
    if(err){
      return res.status(400).json({error:errorHandler(err)});
    }
    res.json({message:"Product deleted successfully"});

  });
};

//by sell=/products?sortBy=sold&order=desc&limit=3
//by arrival=/products?sortBy=createdAt&order=desc&limit=3
//if no params,thens all products are send
exports.list=(req,res)=>{
  let order=req.query.order?req.query.order:"asc";
  let sortBy=req.query.sortBy?req.query.sortBy:"_id";
  let limit=req.query.limit?parseInt(req.query.limit):6;
  Product.find()
  .select("-media")
  .populate("category")
  .sort([[sortBy,order]])
  .limit(limit)
  .exec((err,products)=>{
    if(err){
      return res.status(400).json({error:"Products not found" })
    }
    res.json(products);
  });
};

//find the products based on category
exports.listRelated=(req,res)=>{
  let limit=req.query.limit?parseInt(req.query.limit):6;
  Product.find({_id:{$ne:req.product},category:req.product.category})
.select('-media')
  .limit(limit)
  .populate("category","_id name")
  .exec((err,products)=>{
    if(err){
      return res.status(400).json({error:"Products not found" })
    }
    res.json(products);
  });
};

exports.listCategories=(req,res)=>{
  Product.distinct("category",{},(err,categories)=>{
    if(err){
      return res.status(400).json({error:"Categories not found" })
    }
    res.json(categories);
  });
};

/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */
 exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Product.find(findArgs)
        .select("-media")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

exports.media=(req,res,next)=>{
  if(req.product.media.data){
    res.set("Content-Type",req.product.media.contentType)
    return res.send(req.product.media.data);
  }
  next();
}

exports.listSearch=(req,res)=>{
  const query={};
  if(req.query.search){
    query.name={$regex:req.query.search,$options:"i"};
    if(req.query.category&&req.query.category!="All"){
      query.category=req.query.category;
    }
    Product.find(query,(err,products)=>{
      if(err){
        return res.status(400).json({
          error:errorHandler(err)
        })
      }
      res.json(products);
    }).select("-media");

  }
}
