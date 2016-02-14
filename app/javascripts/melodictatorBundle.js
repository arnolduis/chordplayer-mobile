(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var sampler = require("./sampler")();
var utils = require("./utils");
var theory = require("./theory")();

var lblMelody       = document.getElementById("lblMelody");
var btnNext         = document.getElementById("btnNext");
var btnRepeat       = document.getElementById("btnRepeat");
var btnStop         = document.getElementById("btnStop");
var btnCadence      = document.getElementById("btnCadence");
var iptMelodyLength = document.getElementById("melodyLength");
var iptMelodySpeed  = document.getElementById("melodySpeed");
var iptMaxInterval  = document.getElementById("maxInterval");

var actMelody = [{note: 0 }];
var actMelodyNote = {note: 0 };
var actScaleBase = "C";
var actScaleType = "major";
var actScale = theory.getNotesByName(actScaleBase, actScaleType);
var actCadenceNotes = [0];
var totsMelody = [];
var totsCadence = [];
var cadenceSpeed = 500;
var localData = localStorage && localStorage.melodictator && JSON.parse(localStorage.melodictator);
var selectedInstruments = ["piano"];
var states = [stepPlay, stepShow];
var actState = states.length - 1;

function generateMelody (melodyLength, melodySpeed, maxInterval) {
	if (isNaN(melodyLength) || isNaN(melodySpeed) || isNaN(maxInterval)) {
		return console.log("Inputs are NaN");
	}

	console.log("Generating melody:");
	console.log("Length: ", melodyLength, "Speed: ",melodySpeed);

	var melody = [];
	var intervals = [0];
	var relativeNote = utils.getRandomInt(0,6);
	var melodyNotes = [relativeNote];
	melody.push({
		note: actScale[relativeNote],
		relative: relativeNote,
		duration: melodySpeed
	});

	for (var i = 0; i < melodyLength - 1; i++) {
		var interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);

		while( (interval >= 0 && (actScale[melody[i].relative] > actScale[melody[i].relative + interval])) ||
			   (interval <  0 && (actScale[melody[i].relative] < actScale[melody[i].relative + interval]))) {
			interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);
		}

		intervals.push(interval);
		var nextNoteRelative = utils.mod(melody[i].relative + interval, 7);
		melodyNotes.push(actScale[nextNoteRelative]);
		melody.push({
			note: actScale[nextNoteRelative],
			relative: nextNoteRelative,
			duration: melodySpeed
		});
	}
	console.log("Intervals: ", intervals);
	console.log("Melody   : ", melodyNotes);
	return melody;
}

function showMelody () {
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
	for (var i = 0; i < actMelody.length; i++) {
		noteNames.push(dicSolfege[actMelody[i].relative]);
	}
	lblMelody.innerHTML = noteNames;
}

function playMelody (melody) {
	if (melody === undefined) {
		return console.log("Melody undefined");
	}
	stopMelody();
	playNotes(melody[0].note, selectedInstruments);
	actMelodyNote = melody[0];
	function ivlFunc(melody, i, timeout) {
		totsMelody.push(setTimeout(function () {
			sampler.stopNotes(melody[i - 1].note, "piano");
			if (melody.length !== i) {
				actMelodyNote = melody[i];
				playNotes(melody[i].note, selectedInstruments);
			}
		}, timeout));	
	}

	var sumTimeout = 0;
	for (var i = 1; i <= melody.length; i++) {
		sumTimeout = sumTimeout + melody[i - 1].duration;
		ivlFunc(melody, i, sumTimeout);
	}
}

function stopMelody () {
	sampler.stopNotes(actMelodyNote.note, "piano");
	for (var i = 0; i < totsMelody.length; i++) {
		clearTimeout(totsMelody[i]);
	}
}

function playCadence () {
	for (var i = 0; i < totsCadence.length; i++) {
		clearTimeout(totsCadence[i]);
	}
	sampler.stopNotes(actCadenceNotes, "piano");

	// Guitars only have whole chord samples, no need to get individual notes
	var tons = theory.getNotes(actScale[0], theory.chords[theory.scales[actScaleType].chordTypes[0]].notes);
	var subs = theory.getNotes(actScale[3], theory.chords[theory.scales[actScaleType].chordTypes[3]].notes);
	var doms = theory.getNotes(actScale[4], theory.chords[theory.scales[actScaleType].chordTypes[4]].notes);

	var cadencaNotes = [tons, subs, doms, tons];
	function ivlFunc(cadencaNotes, i) {
		totsCadence.push(setTimeout(function () {
			if (i === cadencaNotes.length) {
				return sampler.stopNotes(actCadenceNotes, "piano");
			}
			sampler.stopNotes(actCadenceNotes, "piano");
			actCadenceNotes = cadencaNotes[i];
			playNotes(cadencaNotes[i]);
		}, i * cadenceSpeed));	
	}

	for (var i = 0; i < cadencaNotes.length + 1; i++) {
		ivlFunc(cadencaNotes, i);
	}
}

function playNotes (notes) {
	for (var i = 0; i < selectedInstruments.length; i++) {
    	if (selectedInstruments[i] === "guitar") {
    		sampler.playNotes([notes[0]],  selectedInstruments[i]);	
    	} else {
		    sampler.playNotes(notes, selectedInstruments[i]);	
    	}
    }
}

// States
function step () {
	actState = (actState +1) % states.length;
	states[actState](actScale);
}

function stepPlay () {
	lblMelody.innerHTML = "?";
    btnNext.innerText = "SHOW ANSWER";
    actScaleBase = utils.getRandomInt(0,11);
	actScale = theory.getNotesByName(theory.nns[actScaleBase], actScaleType);
	playCadence();
	actMelody = generateMelody(parseInt(iptMelodyLength.value), parseInt(iptMelodySpeed.value), parseInt(iptMaxInterval.value));
	setTimeout(function () {
		playMelody(actMelody);
	}, 4 * cadenceSpeed + 50);
}

function stepShow () {
    btnNext.innerText = "NEXT";
	showMelody();
}

// Utils
function saveState () {
	if (localStorage) {
		return console.log("No localstorage available.");
	}

	//TODO
	// var state = {};
	if (localStorage.melodictator) {
		cm2bSaved = JSON.parse(localStorage.melodictator);
	}
	cm2bSaved.chordmatrix = chordmatrix;
	localStorage.melodictator = JSON.stringify(cm2bSaved);
}

// Bindings
btnNext.onclick = function () {
	step();
};

btnRepeat.onclick = function () {
	sampler.stopNotes(actMelodyNote.note, "piano");
	stopMelody();	
	playMelody(actMelody);
};

btnCadence.onclick = function() {
	playCadence();
};

btnStop.onclick = function() {
	sampler.stopNotes(actMelodyNote.note, "piano");
	stopMelody();
};

},{"./sampler":2,"./theory":3,"./utils":4}],2:[function(require,module,exports){
module.exports = function () {

    var samples = {
        piano: {},
        guitar: {},
        strings: {}
    };

    var i = 0;
    samples.piano.notes = [];
    for (i = 0; i < 12; i++) {
    	samples.piano.notes[i] = new Audio("./samples/2mp/piano/mcg_f_0" + (60 + i) + ".ogg");
    }

    samples.piano.cadence = [];
    for (i = 0; i < 12; i++) {
    	samples.piano.cadence[i] = new Audio("./samples/05mp/piano/mcg_f_0" + (60 + i) + ".ogg");
    }

    samples.piano.bass = [];
    for (i = 0; i < 12; i++) {
    	samples.piano.bass[i] = new Audio("./samples/2mp/piano/mcg_f_0" + (48 + i) + ".ogg");
    }

    samples.guitar.notes = [];
    for (i = 0; i < 12; i++) {
    	samples.guitar.notes[i] = new Audio("./samples/2mp/guitar/pwrchord_" + (1 + i) + ".ogg");
    }

    samples.guitar.cadence = [];
    for (i = 0; i < 12; i++) {
    	samples.guitar.cadence[i] = new Audio("./samples/05mp/guitar/pwrchord_" + (1 + i) + ".ogg");
    }

    samples.strings.notes = [];
    for (i = 0; i < 12; i++) {
    	samples.strings.notes[i] = new Audio("samples/2mp/strings/string_0" + (84 + i) + ".ogg");	
    }

    samples.strings.bass = [];
    for (i = 0; i < 12; i++) {
    	samples.strings.bass[i] = new Audio("./samples/2mp/strings/string_0" + (72 + i) + ".ogg");
    }

    samples.strings.cadence = [];
    for (i = 0; i < 12; i++) {
    	samples.strings.cadence[i] = new Audio("./samples/05mp/strings/string_0" + (72 + i) + ".ogg");
    }

    /**
    * @param notes is an array of chromatic notes
    */

    function playNotes (notes, instrument) {
        if (notes === undefined || instrument === undefined) {
            return console.log("Missing params");
        }
        if (notes.constructor !== Array) {
            notes = [notes];
        }

    	if (samples[instrument].bass) {
        	samples[instrument].bass[notes[0]].currentTime = 0;
        	samples[instrument].bass[notes[0]].play();
    	}
        for (var i = 0; i < notes.length; i++) {
            samples[instrument].notes[notes[i]].currentTime = 0;
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
            samples[instrument].bass[notes[0]].pause();
        }
        for (var i = 0; i < notes.length; i++) {
            samples[instrument].notes[notes[i]].pause();
        }
    }

    function stopAllPlaying() {
     	callOnAllSamples("pause");
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
},{}],3:[function(require,module,exports){
var utils = require("./utils");

module.exports = function () {
	var chords = {
		major: {
			notes    : [4, 7],
			jazzNot  : "",
			classNot : ""
		},
		minor: {
			notes    : [3, 7],
			jazzNot  : "m",
			classNot : ""
		},
		diminished: {
			notes    : [3, 6],
			jazzNot  : "dim",
			classNot : "°"
		},
		dominant: {
			notes    : [4, 7, 10],
			jazzNot  : "7",
			classNot : "7"
		},
		sus2: {
			notes    : [2, 7],
			jazzNot  : "sus2",
			classNot : "sus2"
		},
		sus4: {
			notes    : [5, 7],
			jazzNot  : "sus4",
			classNot : "sus4"
		},
		major6: {
			notes    : [4, 7, 9],
			jazzNot  : "6",
			classNot : "6"
		},
		minor6: {
			notes    : [3, 7, 9],
			jazzNot  : "m6",
			classNot : "m6"
		}
	};

	var scales= {
		major: { 
			noteDistances : [2, 4, 5, 7, 9, 11],
			chordTypes    : ["major", "minor", "minor", "major", "major", "minor", "diminished"] },
	};

	var nns = {
	    "C" : 0 , 0 : "C" ,
	    "C#": 1 , 1 : "C#",
	    "D" : 2 , 2 : "D" ,
	    "D#": 3 , 3 : "D#",
	    "E" : 4 , 4 : "E" ,
	    "F" : 5 , 5 : "F" ,
	    "F#": 6 , 6 : "F#",
	    "G" : 7 , 7 : "G" ,
	    "G#": 8 , 8 : "G#",
	    "A" : 9 , 9 : "A" ,
	    "A#": 10, 10: "A#",
	    "B" : 11, 11: "B"
	};

	var dns = {
	    "I"  : 0  , 0  : "I" ,
	    "II" : 2  , 2  : "II",
	    "III": 4  , 4  : "III" ,
	    "IV" : 5  , 5  : "IV",
	    "V"  : 7  , 7  : "V" ,
	    "VI" : 9  , 9  : "VI" ,
	    "VII": 11 , 11 : "VII",
	};

	var extdns = {
	    "I#"  : 1  , 1  : "I#" ,
	    "II#" : 3  , 3  : "II#",
	    "IV#" : 6  , 6  : "IV#",
	    "V#"  : 8  , 8  : "V#" ,
	    "VI#" : 10 , 10 : "VI#" ,
	};

	// Get chromatic notes based on a @base note, and a scale or chord @type
	function getNotes(base, type) {
		if (base === undefined || type === undefined) {
			return console.log("Missing arguments");
		}

		var notes = [utils.mod(base, 12)];
		for (var i = 0; i < type.length; i++) {
			notes.push( utils.mod((base + type[i]), 12));
		}
		return notes;
	}

	//TODO make it work with chords too
	function getNotesByName (actScaleBase, actScaleType) {
		return getNotes(nns[actScaleBase], scales[actScaleType].noteDistances);
	}

	// Get names based on chromatic @notes 
	function getNames (notes) {
		if (notes === undefined) {
			return console.log("Missing arguments");
		}
		if (notes.constructor !== Array) {
			notes = [notes];
		}

		var noteNames = [];
		for (var i = 0; i < notes.length; i++) {
			noteNames.push(nns[notes[i]]);
		}
		return noteNames;
	}

	function generateLabel (chord, actScale, actScaleType) {
		if (chord === undefined || actScale === undefined || actScaleType === undefined) {
			return console.log("Missing arguments");
		}
		var out = getDegree(chord, actScale, actScaleType);
		var lbelDegree = out.label;
		var lbelBase = nns[chord.base];
		var lbelJazz = chords[chord.type].jazzNot;
		var lbelClass = chords[chord.type].classNot;
		return { 
			class: out.class, 
			label: lbelDegree + lbelClass + "<br>" + lbelBase + lbelJazz
		};
	}

	// Generates the classical notation degree basd eon a chord object !!!Also sets the external class if neededttt
	function getDegree (chord, actScale, actScaleType) {
		if (chord === undefined || actScale === undefined || actScaleType === undefined) {
			return console.log("Missing arguments");
		}

		var out = {};
		// Normalize
		var baseNorm = utils.mod(chord.base - actScale[0], 12);
		var degree = actScale.indexOf(chord.base);

		// Count stuff
		if (dns[baseNorm]) {
			out.label = dns[baseNorm];
			out.class = "";
			if (scales[actScaleType].chordTypes[degree] !== chord.type) {
				out.class = " external";
			}
		} else if (extdns[baseNorm]){
			out.label = extdns[baseNorm];
			out.class = " external";
		} else {
			return console.log("Something wrong in the getDegree function");
		}
		if ("minor" ===	 chord.type || "diminished" === chord.type) {
			out.label = out.label.toLowerCase();
		}
		return out;
	}

	return {
		chords: chords,
		scales: scales,
		nns: nns,
		dns: dns,
		extdns: extdns,

		getNotes: getNotes,
		getNames: getNames,
		generateLabel: generateLabel,
		getNotesByName: getNotesByName,
		getDegree: getDegree
	};
};

	// If given a @scale, count down 2 triads from @base 
	// function getTriadByScale (base, scale) {
	//     var notes = [base];
	//     console.log("base", base);
	//     console.log("scale", scale);
	//     if (scale.indexOf(base) < 0) {
	//         console.log("Base not in scale");
	//         return;
	//     } else {
	//         for (var i = 1; i <= 2; i++) {
	//             notes.push(scale[(scale.indexOf(base) + i*2) % scale.length]);
	//         }
	//     }
	//     console.log("notes", notes);
	//     return notes;
	// }
},{"./utils":4}],4:[function(require,module,exports){
module.exports.mod = function (x, m) {
	return (x + m) % m;
};

/**
 * Returns a random number between min (inclusive) and max (exclusive)
 */
 module.exports.getRandomArbitrary = function (min, max) {
    return Math.random() * (max - min) + min;
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive)
 * Using Math.round() will give you a non-uniform distribution!
 */
 module.exports.getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
},{}]},{},[1]);
