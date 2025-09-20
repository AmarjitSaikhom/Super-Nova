const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);


    const user = decoded;

    // Attach user to both req and res to support controllers that read either
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}


module.exports = {
    authMiddleware
}