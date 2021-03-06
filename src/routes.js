"use strict";
/**
 * Express routes, url handling
 */

var express = require('express');
var path = require('path');
var app = express();
var config = require(__dirname + "/config");

app.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname + "/../public/index.html"));
});

// output the required ws port number
app.get("/wsport", function (req, res) {
    res.send((config.port + 1).toString());
});

app.use(express.static(__dirname + "/../public"));

app.listen(config.port, config.host, function () {

});
