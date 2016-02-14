var application = require("application");

var liveedit = require('nativescript-liveedit');
liveedit.restartFile("./app.css");

application.mainModule = "melodictator";
application.cssFile = "./app.css";
application.start();
