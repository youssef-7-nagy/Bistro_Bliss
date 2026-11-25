const { Product } = require("../models/Product");
const { Upload } = require("../models/Upload");
const { createProductSchema } = require("../validators/product.validator");
const sharp = require("sharp");
const path = require("path");

async function saveUploadedImage(file) {
  const parsed = path.parse(file.originalname || "dish.png");
  const safeBaseName = (parsed.name || "dish").replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  let buffer = file.buffer;
  let contentType = file.mimetype || "application/octet-stream";
  let ext = parsed.ext || ".png";

  try {
    buffer = await sharp(file.buffer)
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    contentType = "image/webp";
    ext = ".webp";
  } catch (error) {
    console.log("Image optimization failed, storing original buffer:", error.message);
  }

  const filename = `${uniquePrefix}-${safeBaseName}${ext}`;
  await Upload.create({ filename, contentType, data: buffer });
  return `uploads/${filename}`;
}

// 1. Create Product
async function createProduct(request, response) {
  try {
    const { error } = createProductSchema.validate(request.body);
    if(error){
      return response.status(400).json({message: error.message})
    }

    const owner = request.user.id;

    const images = request.files
      ? await Promise.all(request.files.map((file) => saveUploadedImage(file)))
      : [];
    
    const lastProduct = await Product.findOne().sort({ order: -1 });
    const nextOrder = lastProduct && lastProduct.order !== undefined ? lastProduct.order + 1 : 0;

    const product = await Product.create({ owner, images, order: nextOrder, ...request.body });
    
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
    const products = await Product.find().sort({ order: 1, createdAt: -1 });
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

// Reorder Products
async function reorderProducts(request, response) {
  try {
    const { items } = request.body; // Expecting [{id, order}]
    
    if (!Array.isArray(items)) {
      return response.status(400).json({ message: "Items must be an array" });
    }

    const updates = items.map(item => 
      Product.findByIdAndUpdate(item.id, { order: item.order })
    );

    await Promise.all(updates);

    response.json({ message: "Products reordered successfully" });
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
  reorderProducts,
};
