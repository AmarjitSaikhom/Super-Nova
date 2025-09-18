const express = require("express");
const validator = require("../middlewares/validator.middleware");
const authController = require("../controller/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /api/auth/register
router.post(
  "/register",
  validator.registerUserValidations,
  authController.registerUser
);

// POST /api/auth/login
router.post("/login", validator.loginUserValidations, authController.loginUser);

// GET /api/auth/me/
router.get("/me", authMiddleware.authMiddleware, authController.getCurrentUser);

module.exports = router;
