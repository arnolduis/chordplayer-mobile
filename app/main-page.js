var vmModule = require("./main-view-model");
var fs = require("file-system");
var sound = require("nativescript-sound");
global.media;


exports.pageLoaded = function (args) {
    global.media = sound.create("~/samples/05mp/piano/mcg_f_048.ogg");
    var page = args.object;
    page.bindingContext = vmModule.mainViewModel;
};
