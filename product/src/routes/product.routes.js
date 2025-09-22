const express = require("express");
const multer = require("multer");
const productController = require("../controllers/product.controller");
const createAuthMiddleware = require("../middleware/auth.middleware");
const { createProductValidators } = require("../validators/product.validators");

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/products/
router.post(
  "/",
  createAuthMiddleware(["admin", "seller"]),
  upload.array("images", 5),
  createProductValidators,
  productController.createProduct
);

module.exports = router;
