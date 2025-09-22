const express = require("express");
const cookeParser = require("cookie-parser");
const productRoutes = require("./routes/product.routes");

const app = express();
app.use(express.json());
app.use(cookeParser());

app.use('/api/products', productRoutes)

module.exports = app;
