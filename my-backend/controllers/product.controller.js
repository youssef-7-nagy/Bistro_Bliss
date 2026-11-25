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

async function deleteStoredImages(imagePaths = []) {
  const filenames = imagePaths
    .map((imgPath) => String(imgPath || "").trim())
    .filter((imgPath) => imgPath.startsWith("uploads/"))
    .map((imgPath) => imgPath.replace(/^uploads\//, ""));

  if (filenames.length === 0) return;

  try {
    await Upload.deleteMany({ filename: { $in: filenames } });
  } catch (error) {
    console.log("Failed to clean up old image documents:", error.message);
  }
}

function parseRetainedImages(body, existingImages = []) {
  if (body.retainedImages === undefined) {
    if (body.removeImages === true || body.removeImages === "true") {
      return [];
    }
    return existingImages;
  }

  let parsed = body.retainedImages;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = parsed ? [parsed] : [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  const existingSet = new Set(existingImages);
  return parsed.filter((item) => typeof item === "string" && existingSet.has(item));
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
    
    const lastProduct = await Product.findOne({ category: request.body.category }).sort({
      displayOrder: -1,
      order: -1,
    });
    const currentMax = lastProduct
      ? Math.max(Number(lastProduct.displayOrder ?? -1), Number(lastProduct.order ?? -1))
      : -1;
    const nextOrder = currentMax + 1;

    const product = await Product.create({
      owner,
      images,
      order: nextOrder,
      displayOrder: nextOrder,
      ...request.body,
    });
    
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
    const products = await Product.find().lean();
    products.sort((a, b) => {
      const orderA = Number(a.displayOrder ?? a.order ?? 0);
      const orderB = Number(b.displayOrder ?? b.order ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
    const normalized = products.map((product) => ({
      ...product,
      displayOrder: product.displayOrder ?? product.order ?? 0,
      isAvailable: product.isAvailable !== false,
    }));
    response.json({ message: "All Products", data: normalized });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}


async function updateProduct(request, response) {
  try {
    const { id } = request.params;
    const existing = await Product.findById(id);

    if (!existing) {
      return response.status(404).json({ message: "Product not found" });
    }

    const updatePayload = {};
    if (request.body.title !== undefined) updatePayload.title = String(request.body.title).trim();
    if (request.body.description !== undefined) updatePayload.description = String(request.body.description);
    if (request.body.price !== undefined) updatePayload.price = Number(request.body.price);
    if (request.body.stock !== undefined && request.body.stock !== "") updatePayload.stock = Number(request.body.stock);
    if (request.body.isAvailable !== undefined) {
      updatePayload.isAvailable =
        request.body.isAvailable === true || request.body.isAvailable === "true";
    }

    const nextCategory = request.body.category
      ? String(request.body.category).trim()
      : existing.category;
    const categoryChanged = nextCategory !== existing.category;
    if (request.body.category !== undefined) {
      updatePayload.category = nextCategory;
    }

    if (categoryChanged) {
      const lastInTarget = await Product.findOne({ category: nextCategory }).sort({
        displayOrder: -1,
        order: -1,
      });
      const targetMax = lastInTarget
        ? Math.max(Number(lastInTarget.displayOrder ?? -1), Number(lastInTarget.order ?? -1))
        : -1;
      const nextOrder = targetMax + 1;
      updatePayload.category = nextCategory;
      updatePayload.order = nextOrder;
      updatePayload.displayOrder = nextOrder;
    }

    const existingImages = Array.isArray(existing.images) ? existing.images : [];
    const baseImages = parseRetainedImages(request.body, existingImages);
    const uploadedImages = request.files?.length
      ? await Promise.all(request.files.map((file) => saveUploadedImage(file)))
      : [];

    if (request.body.retainedImages !== undefined || request.body.removeImages !== undefined || uploadedImages.length > 0) {
      updatePayload.images = [...baseImages, ...uploadedImages].slice(0, 5);
    }

    const product = await Product.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (updatePayload.images) {
      const nextSet = new Set(updatePayload.images);
      const removedImages = existingImages.filter((img) => !nextSet.has(img));
      await deleteStoredImages(removedImages);
    }

    if (categoryChanged) {
      const remainingOld = await Product.find({ category: existing.category }).sort({
        displayOrder: 1,
        order: 1,
        createdAt: -1,
      });
      if (remainingOld.length > 0) {
        await Product.bulkWrite(
          remainingOld.map((item, idx) => ({
            updateOne: {
              filter: { _id: item._id },
              update: { $set: { order: idx, displayOrder: idx } },
            },
          }))
        );
      }
    }

    response.json({ message: "Product updated successfully", data: product });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      return response.status(400).json({ message: error.message });
    }
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

    await deleteStoredImages(product.images || []);
    response.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" }); 
  }
}

// Reorder Products (independent per category)
async function reorderProducts(request, response) {
  try {
    const { items, category } = request.body; // Expecting { category?, items: [{ id, displayOrder, order }] }

    if (!Array.isArray(items) || items.length === 0) {
      return response.status(400).json({ message: "Items must be a non-empty array" });
    }

    const operations = items.map((item, index) => {
      const nextOrder = Number(item.displayOrder ?? item.order ?? index);
      const filter = category ? { _id: item.id, category } : { _id: item.id };
      return {
        updateOne: {
          filter,
          update: { $set: { displayOrder: nextOrder, order: nextOrder } },
        },
      };
    });

    await Product.bulkWrite(operations);

    response.json({ message: "Category menu order updated successfully" });
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
