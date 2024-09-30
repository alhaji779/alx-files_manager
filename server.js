/**
 * This is the main js file to load all component
 */
require('dotenv').config();
const express = require('express');
const app = express();
const routeA = require('./routes')
var cors = require('cors');

const port = process.env.PORT || 5000;
app.use(cors());
app.use(routeA);


app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});