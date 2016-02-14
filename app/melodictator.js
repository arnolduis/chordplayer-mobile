var vmModule = require("./melodictator-view-model");

exports.onLoaded = function (args) {
    var page = args.object;
    page.bindingContext = vmModule.mainViewModel;
};
