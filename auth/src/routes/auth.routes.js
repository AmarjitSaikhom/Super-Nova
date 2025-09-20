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

// GET /api/auth/logout
router.get("/logout", authController.logoutUser);

// GET /api/auth/users/me/addresses
router.get(
  "/users/me/addresses",
  authMiddleware.authMiddleware,
  authController.getUserAddresses
);


// POST /api/auth/users/me/addresses
router.post("/users/me/addresses", validator.addUserAddressValidations, authMiddleware.authMiddleware, authController.addUserAddress);


// DELETE /api/auth/users/me/addresses/:addressId
router.delete("/users/me/addresses/:addressId", authMiddleware.authMiddleware, authController.deleteUserAddress);

module.exports = router;
