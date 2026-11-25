const express = require("express");
const productController = require("../controllers/product.controller");
const { roleMiddleWare } = require("../middlewares/role.middleware");
const { authMiddleWare } = require("../middlewares/auth.middleware");
const { uploadDishImages } = require("../utils/upload");
const router = express.Router();


router.get("", productController.getAllProducts);
router.get("/:id", productController.getProduct);


router.post("",
    authMiddleWare,
    roleMiddleWare("admin", "manager"),
    uploadDishImages,
    productController.createProduct
);


router.put("/reorder",
    authMiddleWare,
    roleMiddleWare("admin", "manager"),
    productController.reorderProducts
);

router.put("/:id", 
    authMiddleWare, 
    roleMiddleWare("admin", "manager"),
    uploadDishImages,
    productController.updateProduct
);

router.delete("/:id", 
    authMiddleWare, 
    roleMiddleWare("admin", "manager"), 
    productController.deleteProduct
);

module.exports = router;