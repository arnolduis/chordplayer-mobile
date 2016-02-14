var sound = require("nativescript-sound");
var observable = require("data/observable");

var HelloWorldModel = (function (_super) {
    __extends(HelloWorldModel, _super);

    function HelloWorldModel() {
        _super.call(this);
        this.counter = 42;
        this.set("message", this.counter + " taps left");
        this.set("lblMelody", "Melody solmization");
    }

    HelloWorldModel.prototype.tapAction = function () {
        this.counter--;
        if (this.counter <= 0) {
            this.set("message", "Hoorraaay! You unlocked the NativeScript clicker achievement!");
        }
        else {
            this.set("message", this.counter + " taps left");
        }
    };
    
    HelloWorldModel.prototype.playSound = function(args) {
        console.log("Play sound");
        global.media.play();
    };

    return HelloWorldModel;

})(observable.Observable);
exports.HelloWorldModel = HelloWorldModel;
exports.mainViewModel = new HelloWorldModel();
