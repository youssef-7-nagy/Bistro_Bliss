const { Product } = require("../models/Product");
const { createProductSchema } = require("../validators/product.validator")

// 1. Create Product
async function createProduct(request, response) {
  try {
    const { error } = createProductSchema.validate(request.body);
    if(error){
      return response.status(400).json({message: error.message})
    }

    const owner = request.user.id;

    const images = request.files.map((f) => f.path);
    
    const product = await Product.create({ owner, images, ...request.body });
    
    response.status(201).json({
      message: "Product created successfully!",
      data: { product }
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}


async function getProduct(request, response) {
  try {
    const { id } = request.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return response.status(404).json({ message: "Product Not Found" });
    }
    response.json({ message: "Product", data: product }); 
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}


async function getAllProducts(request, response) {
  try {
    const products = await Product.find();
    response.json({ message: "All Products", data: products }); 
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}


async function updateProduct(request, response) {
  try {
    const { id } = request.params;
    // Update fields }
    const product = await Product.findByIdAndUpdate(id, request.body, { new: true });
    
    if (!product) {
        return response.status(404).json({ message: "Product not found" });
    }

    response.json({ message: "Product updated successfully", data: product });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" }); 
  }
}

// Delete Product 
async function deleteProduct(request, response) {
  try {
    const { id } = request.params;
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
        return response.status(404).json({ message: "Product not found" });
    }

    response.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" }); 
  }
}

module.exports = {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};