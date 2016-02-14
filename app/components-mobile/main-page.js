var fs = require("file-system");

var frameModule = require("ui/frame");
var page = require("ui/page");
var sound = require("nativescript-sound");

var vmModule = require("./main-view-model");
var topmost = frameModule.topmost();

exports.pageLoaded = function (args) {
    global.media = sound.create("~/samples/05mp/piano/mcg_f_048.ogg");
    var page = args.object;
    page.bindingContext = vmModule.mainViewModel;
};