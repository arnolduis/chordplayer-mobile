var observable = require("data/observable");
var sampler = require("~/sampler-mobile")();
var utils = require("~/javascripts/utils");
var theory = require("~/javascripts/theory")();

var MelodictatorModel = (function (_super) {
    __extends(MelodictatorModel, _super);

    var self;
    function MelodictatorModel() {
        _super.call(this);
        self = this;
        this.set("lblMelody", "Melody solmization");
        this.set("lblBtnNext", "NEXT");

        this.set("melodyLength", 5);
        this.set("melodySpeed", 1000);
        this.set("maxInterval", 3);

        this.title = "Melodictator";

        this.actMelody = [{note: 0 }];
        this.actMelodyNote = {note: 0 };
        this.actScaleBase = "C";
        this.actScaleType = "major";
        this.actScale = theory.getNotesByName(this.actScaleBase, this.actScaleType);
        this.actCadenceNotes = [0];
        this.totsMelody = [];
        this.totsCadence = [];
        this.cadenceSpeed = 500;
        // this.localData = localStorage && localStorage.melodictator && JSON.parse(localStorage.melodictator);
        this.selectedInstruments = ["piano"];
        this.states = [this.stepPlay, this.stepShow];
        this.actState = this.states.length - 1;
    }






    MelodictatorModel.prototype.generateMelody = function (melodyLength, melodySpeed, maxInterval) {
        if (isNaN(melodyLength) || isNaN(melodySpeed) || isNaN(maxInterval)) {
            return console.log("Inputs are NaN");
        }

        //TODO
        if (typeof melodySpeed === "string") {
            melodySpeed = parseInt(melodySpeed);
            self.set("melodySpeed", melodySpeed);
        }

        console.log("Generating melody:");
        console.log("Length: ", melodyLength, "Speed: ",melodySpeed);

        var melody = [];
        var intervals = [0];
        var relativeNote = utils.getRandomInt(0,6);
        var melodyNotes = [relativeNote];
        melody.push({
            note: self.actScale[relativeNote],
            relative: relativeNote,
            duration: melodySpeed
        });

        for (var i = 0; i < melodyLength - 1; i++) {
            var interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);
            var nextAbs = melody[i].note + interval;

            // while(  nextAbs < 0 || nextAbs > 11) {
            //     interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);
            //     nextAbs = melody[i].note + interval;
            // }

            while(  0 > nextAbs || nextAbs > 11 ||
                    (interval >= 0 && (self.actScale[melody[i].relative] > self.actScale[melody[i].relative + interval])) ||
                    (interval <  0 && (self.actScale[melody[i].relative] < self.actScale[melody[i].relative + interval]))) {
                interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);
                nextAbs = melody[i].note + interval;
            }

            intervals.push(interval);
            var nextNoteRelative = utils.mod(melody[i].relative + interval, 7);
            melodyNotes.push(self.actScale[nextNoteRelative]);
            melody.push({
                note: self.actScale[nextNoteRelative],
                relative: nextNoteRelative,
                duration: melodySpeed
            });
        }
        console.log("Intervals: ", intervals);
        console.log("Melody   : ", melodyNotes);
        return melody;
    };

    MelodictatorModel.prototype.showMelody = function () {
        var dicSolfege = {
            0 : "do","do" : 0,
            1 : "re","re" : 1,
            2 : "mi","mi" : 2,
            3 : "fa","fa" : 3,
            4 : "so","so" : 4,
            5 : "la","la" : 5,
            6 : "ti","ti" : 6
        };
        var noteNames = [];
        for (var i = 0; i < self.actMelody.length; i++) {
            noteNames.push(dicSolfege[self.actMelody[i].relative]);
        }
        self.set("lblMelody", noteNames);
    };

    MelodictatorModel.prototype.playMelody = function (melody) {
        if (melody === undefined) {
            return console.log("Melody undefined");
        }
        self.stopMelody();
        self.playNotes(melody[0].note, self.selectedInstruments);
        self.actMelodyNote = melody[0];
        function ivlFunc(melody, j, timeout) {
            self.totsMelody.push(setTimeout(function () {
                sampler.stopNotes(melody[j - 1].note, "piano");
                if (melody.length !== j) {
                    self.actMelodyNote = melody[j];
                    self.playNotes(melody[j].note, self.selectedInstruments);
                }
            }, timeout));   
        }

        var sumTimeout = 0;
        for (var i = 1; i <= melody.length; i++) {
            sumTimeout = sumTimeout + melody[i - 1].duration;
            ivlFunc(melody, i, sumTimeout);
        }
    };

    MelodictatorModel.prototype.stopMelody = function () {
        sampler.stopNotes(self.actMelodyNote.note, "piano");
        for (var i = 0; i < self.totsMelody.length; i++) {
            clearTimeout(self.totsMelody[i]);
        }
        self.totsMelody = [];
    };

    MelodictatorModel.prototype.playCadence = function (args) {
        if (args !== undefined && args.object !==   undefined) {
            self.falshButton(args);
        }
        for (var i = 0; i < self.totsCadence.length; i++) {
            clearTimeout(self.totsCadence[i]);
        }
        sampler.stopNotes(self.actCadenceNotes, "piano");

        // Guitars only have whole chord samples, no need to get individual notes
        var tons = theory.getNotes(self.actScale[0], theory.chords[theory.scales[self.actScaleType].chordTypes[0]].notes);
        var subs = theory.getNotes(self.actScale[3], theory.chords[theory.scales[self.actScaleType].chordTypes[3]].notes);
        var doms = theory.getNotes(self.actScale[4], theory.chords[theory.scales[self.actScaleType].chordTypes[4]].notes);

        var cadencaNotes = [tons, subs, doms, tons];
        function ivlFunc(cadencaNotes, i) {
            self.totsCadence.push(setTimeout(function () {
                if (i === cadencaNotes.length) {
                    return sampler.stopNotes(self.actCadenceNotes, "piano");
                }
                sampler.stopNotes(self.actCadenceNotes, "piano");
                self.actCadenceNotes = cadencaNotes[i];
                self.playNotes(cadencaNotes[i]);
            }, i * self.cadenceSpeed));  
        }

        for (var i = 0; i < cadencaNotes.length + 1; i++) {
            ivlFunc(cadencaNotes, i);
        }
    };

    MelodictatorModel.prototype.playNotes = function (notes) {
        for (var i = 0; i < self.selectedInstruments.length; i++) {
            if (self.selectedInstruments[i] === "guitar") {
                sampler.playNotes([notes[0]],  self.selectedInstruments[i]); 
            } else {
                sampler.playNotes(notes, self.selectedInstruments[i]);   
            }
        }
    };

    // self.States
    MelodictatorModel.prototype.step = function (args) {
        self.falshButton(args);
        self.actState = (self.actState +1) % self.states.length;
        self.states[self.actState](self.actScale);
    };

    MelodictatorModel.prototype.stepPlay = function () {
        self.set("lblMelody", "?");
        self.set("lblBtnNext", "SHOW ANSWER");
        self.actScaleBase = utils.getRandomInt(0,11);
        self.actScale = theory.getNotesByName(theory.nns[self.actScaleBase], self.actScaleType);
        self.playCadence();
        //TODO
        self.actMelody = self.generateMelody(self.melodyLength, self.melodySpeed, self.maxInterval);
        setTimeout(function () {
            self.playMelody(self.actMelody);
        }, 4 * self.cadenceSpeed + 50);
    };

    MelodictatorModel.prototype.stepShow = function () {
        self.set("lblBtnNext", "NEXT");
        self.showMelody();
    };

    MelodictatorModel.prototype.repeat = function (args) {
        self.falshButton(args);

        console.log("Repeat");
        sampler.stopNotes(self.actMelodyNote.note, "piano");
        self.stopMelody();   
        self.playMelody(self.actMelody);
    };

    MelodictatorModel.prototype.stop = function (args) {
        self.falshButton(args);
        sampler.stopNotes(self.actMelodyNote.note, "piano");
        self.stopMelody();
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
