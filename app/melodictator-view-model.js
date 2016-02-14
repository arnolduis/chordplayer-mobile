var observable = require("data/observable");
var melodictator = require("~/melodictatorModule");

var MelodictatorModel = (function (_super) {
	__extends(MelodictatorModel, _super);

	var self;
	function MelodictatorModel() {
		_super.call(this);
		self = this;
		this.title = "Melodictator";

		this.set("lblMelody", "Melody solmization");
		this.set("lblBtnNext", "NEXT");

		this.set("melodyLength", 5);
		this.set("melodySpeed", 1000);
		this.set("maxInterval", 3);

		this.states = [self.stepPlay, self.stepShow];
		this.actState = this.states.length - 1;

	}

	MelodictatorModel.prototype.step = function (args) {
		self.falshButton(args);
		self.actState = (self.actState +1) % self.states.length;
		self.states[self.actState]();
	};

	MelodictatorModel.prototype.stepPlay = function () {
		self.set("lblMelody", "?");
		self.set("lblBtnNext", "SHOW ANSWER");
		melodictator.stepPlay({
			melodyLength: self.melodyLength,
			melodySpeed: self.melodySpeed,
			maxInterval: self.maxInterval
		});
	};

	MelodictatorModel.prototype.stepShow = function () {
		self.set("lblBtnNext", "NEXT");
		self.set("lblMelody", melodictator.showMelody());
	};

	MelodictatorModel.prototype.repeat = function (args) {
		self.falshButton(args);
		melodictator.repeat();
	};

	MelodictatorModel.prototype.playCadence = function (args) {
		self.falshButton(args);
		melodictator.playCadence();
	};

	MelodictatorModel.prototype.stop = function (args) {
		self.falshButton(args);
		melodictator.stop();
	};

	MelodictatorModel.prototype.falshButton = function (args) {
		if (args === undefined || args. object ===   undefined) {
			return console.log("Missing button args");
		}
		var btn = args.object;
		var oldColor = btn.style.backgroundColor;
		btn.style.backgroundColor = "#3cb0fd";
		setTimeout(function() {
			btn.style.backgroundColor = oldColor;
		},
		50);
	};


	return MelodictatorModel;


})(observable.Observable);

exports.MelodictatorModel = MelodictatorModel;
exports.mainViewModel = new MelodictatorModel();
