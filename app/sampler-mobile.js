var Audio = require("nativescript-sound");

module.exports = function () {

    console.log("sampler/mobile.js 5");
    var samples = {
        piano: {},
        guitar: {},
        strings: {}
    };

    var sampleBaseDir = "~/samples";

    var i = 0;
    samples.piano.notes = [];
    for (i = 0; i < 12; i++) {
    	samples.piano.notes[i] = Audio.create(sampleBaseDir + "/2mp/piano/mcg_f_0" + (60 + i) + ".ogg");
    }

    samples.piano.cadence = [];
    for (i = 0; i < 12; i++) {
    	samples.piano.cadence[i] = Audio.create(sampleBaseDir + "/05mp/piano/mcg_f_0" + (60 + i) + ".ogg");
    }

    samples.piano.bass = [];
    for (i = 0; i < 12; i++) {
    	samples.piano.bass[i] = Audio.create(sampleBaseDir + "/2mp/piano/mcg_f_0" + (48 + i) + ".ogg");
    }

    samples.guitar.notes = [];
    for (i = 0; i < 12; i++) {
    	samples.guitar.notes[i] = Audio.create(sampleBaseDir + "/2mp/guitar/pwrchord_" + (1 + i) + ".ogg");
    }

    samples.guitar.cadence = [];
    for (i = 0; i < 12; i++) {
    	samples.guitar.cadence[i] = Audio.create(sampleBaseDir + "/05mp/guitar/pwrchord_" + (1 + i) + ".ogg");
    }

    samples.strings.notes = [];
    for (i = 0; i < 12; i++) {
    	samples.strings.notes[i] = Audio.create(sampleBaseDir + "/2mp/strings/string_0" + (84 + i) + ".ogg");	
    }

    samples.strings.bass = [];
    for (i = 0; i < 12; i++) {
    	samples.strings.bass[i] = Audio.create(sampleBaseDir + "/2mp/strings/string_0" + (72 + i) + ".ogg");
    }

    samples.strings.cadence = [];
    for (i = 0; i < 12; i++) {
    	samples.strings.cadence[i] = Audio.create(sampleBaseDir + "/05mp/strings/string_0" + (72 + i) + ".ogg");
    }

    console.log("Samples loaded");

    /**
    * @param notes is an array of chromatic notes
    */

    function playNotes (notes, instrument) {
        console.log("playNotes");
        if (notes === undefined || instrument === undefined) {
            return console.log("Missing params");
        }
        if (notes.constructor !== Array) {
            notes = [notes];
        }

    	if (samples[instrument].bass) {
        	// samples[instrument].bass[notes[0]].currentTime = 0;
        	samples[instrument].bass[notes[0]].play();
    	}
        for (var i = 0; i < notes.length; i++) {
            // samples[instrument].notes[notes[i]].currentTime = 0;
            samples[instrument].notes[notes[i]].play();
        }
    }

    function stopNotes (notes, instrument) {
        if (notes === undefined || instrument === undefined) {
            return console.log("Missing params");
        }
        if (notes.constructor !== Array) {
            notes = [notes];
        }

        if (samples[instrument].bass) {
            samples[instrument].bass[notes[0]].stop();
        }
        for (var i = 0; i < notes.length; i++) {
            samples[instrument].notes[notes[i]].stop();
        }
    }

    function stopAllPlaying() {
     	callOnAllSamples("stop");
    } 

    function setOnAllSamples (myVariable, arg1) {
         for (var i in samples) {
            for (var j in samples[i]) {
                for (var k = 0; k < samples[i][j].length; k++) {
                    samples[i][j][k][myVariable] = arg1;
                }
            }
        }
    }

    function callOnAllSamples (myFunc, arg1, arg2, arg3, arg4) {
         for (var i in samples) {
            for (var j in samples[i]) {
                for (var k = 0; k < samples[i][j].length; k++) {
                    samples[i][j][k][myFunc](arg1, arg2, arg3, arg4);
                }
            }
        }
    }

    function getInstrumentNames () {
        return  Object.keys(samples);
    }

    return  {
        playNotes: playNotes,
        stopNotes: stopNotes,
        stopAllPlaying: stopAllPlaying,
        setOnAllSamples: setOnAllSamples,
        callOnAllSamples: callOnAllSamples,
        getInstrumentNames: getInstrumentNames
    };
};