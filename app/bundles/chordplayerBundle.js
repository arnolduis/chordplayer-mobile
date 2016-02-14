(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var sampler = require("./sampler")();
var theory = require("./theory")();
var utils = require("./utils");

var totCadence;
var states = [stepPlay, stepShow];
var actState = 0;
var actChords = []; // Chords chosen
var actChord = 0; // actChords id
var actVolume = 1;
var actScaleBase = "C";
var actScaleType = "major";
var actScale;
var selectedInstruments = ["piano"];
var chordType2Colum = {};
var tableDegrees = ["I","I#","II","II#","III","IV","IV#","V","V#","VI","VI#","VII"];
var localData = localStorage && localStorage.chordplayer && JSON.parse(localStorage.chordplayer);
var chordmatrix;

var btnNext         = document.getElementById("btnNext");
var btnRepeat       = document.getElementById("btnRepeat");
var btnCadence      = document.getElementById("btnCadence");
var btnInitExercise = document.getElementById("btnInitExercise");
var btsaveExercise  = document.getElementById("btsaveExercise");
var lblChordName    = document.getElementById("chordName");
var sctInstruments  = document.getElementById("sctInstruments");
var ctrChord        = document.getElementById("chord-container");
var rngVolume       = document.getElementById("rngVolume");
var chordtable      = document.getElementById("chordtable");
var sctScale        = document.getElementById("sctScale");
var chordtableplay  = document.getElementById("chordtableplay");



init();

function init () {
	var i;
	// Init instrument select box
	var instrumentNames = sampler.getInstrumentNames();
	for (i in instrumentNames) {
		var optInstrument = document.createElement("option");
		optInstrument.value = instrumentNames[i];
		optInstrument.innerHTML = instrumentNames[i];
		sctInstruments.appendChild(optInstrument);
	}

	// Load selected chords from localStorage, or default;
	if (localData) {
		chordmatrix = localData.chordmatrix;
		actScaleBase = localData.actScaleBase || "C";
		actScaleType = localData.actScaleType || "major";
	} else {
		chordmatrix = [];
		for (i = 0; i < 12; i++) {
			var chordsLength = Object.keys(theory.chords).length;
			chordmatrix[i] = [];
			for (var j = 0; j < chordsLength; j++) {
				chordmatrix[i].push(0);
			}
		}
		chordmatrix[0][0]  = 1;
		chordmatrix[2][1]  = 1;
		chordmatrix[4][1]  = 1;
		chordmatrix[5][0]  = 1;
		chordmatrix[7][0]  = 1;
		chordmatrix[9][1]  = 1;
		chordmatrix[11][2] = 1;
	}

	actScale = theory.getNotesByName(actScaleBase, actScaleType);

	initChordtable();
	initExercise();
			
	// Preselect <select> elements and prepare ui
	
	rngVolume.value = actVolume * 100;
	sampler.setOnAllSamples("volume", actVolume);
	sctScale.options[theory.nns[actScaleBase]].selected = "selected";
	sctInstruments.options[0].selected = "selected";
	btnNext.focus();	
}

function initExercise (options) {
	var i;

	saveChordMatrix();

	// Fill up actChords, based on cordtable
	actChords = [];
	for (i = 0; i < chordmatrix.length; i++) {
		for (var j = 0; j < chordmatrix[i].length; j++) {
			if (chordmatrix[i][j]) {
				var base = utils.mod(actScale[0] + i,12);
				actChords.push({
					degree: i,
					base: base,
					type: chordtable.rows[i+1].cells[j + 1].dataset.type,
					notes: theory.getNotes(base, theory.chords[chordType2Colum[j]].notes),
				});
			}
		}
	}

	actChords.sort(actChords);

	// Build buttons
	 while (ctrChord.firstChild) {
	    ctrChord.removeChild(ctrChord.firstChild);
	}

	function evlrPlayChord (event) {
		var notes = actChords[parseInt(event.srcElement.dataset.i)].notes;
		sampler.stopAllPlaying();
		playNotes(notes);

	}
	for (i = 0; i < actChords.length; i++) {
		var btnChord = document.createElement("div");
		var label = theory.generateLabel(actChords[i], actScale, actScaleType);
		btnChord.dataset.i = i;
		btnChord.className = "btn chord" + label.class;
		btnChord.innerHTML = label.label;
		btnChord.addEventListener("click", evlrPlayChord);
		ctrChord.appendChild(btnChord);
	}
}

function initChordtable () {
	// Prepare chordtable
	chordtable.innerHTML = "";
	var theader = chordtable.createTHead();
	var tbody = chordtable.createTBody();
	var row = theader.insertRow(0);    
	var cell = row.insertCell(0);
	var rowLength = 0;

	// Head
	for (var j in theory.chords) {
		chordType2Colum[rowLength] = j;
		cell = row.insertCell(-1);
		cell.innerHTML = j;
		rowLength++;
	}
	// Body
	for (i = 0; i < 12; i++) {
		row = tbody.insertRow(-1);
		cell = row.insertCell(-1);
		cell.innerHTML = tableDegrees[i];

		for (j = 0; j < rowLength; j++) {
			cell = row.insertCell(-1);
			cell.dataset.type = theader.rows[0].cells[j+1].innerHTML;
			if (chordmatrix[i][j]) {
				cell.dataset.selected = 1;
				cell.style.backgroundColor = "red";
			} else {
				cell.dataset.selected = 0;
			}
			cell.dataset.degree = i;
			cell.dataset.cmxcol = j;
			cell.onclick = evlrChordTable;
			cell.innerHTML = theory.nns[utils.mod(i + actScale[0], 12)] + theory.chords[theader.rows[0].cells[j+1].innerHTML].jazzNot;	
		}
	}

	function evlrChordTable () {
		if (chordtableplay.checked) {
			sampler.stopAllPlaying();
			var notes = theory.getNotes(parseInt(this.dataset.degree + actScale[0]), theory.chords[this.dataset.type].notes);
			playNotes(notes);
		} else {
			var selectedInt = utils.mod(parseInt(this.dataset.selected) + 1, 2);
			chordmatrix[this.dataset.degree][this.dataset.cmxcol] = selectedInt;
			if (selectedInt) {
				this.style.backgroundColor = "red";
			} else {
				this.style.backgroundColor = "white";
			}
			this.dataset.selected = selectedInt;
		}
	}
}

function stepPlay () {
	console.log("NEW ROUND:");
	sampler.stopAllPlaying();
	clearTimeout(totCadence);
    lblChordName.innerHTML = "	?	";
    btnNext.innerText = "SHOW ANSWER";

    // if (allowedDegrees.length === 1) {
    	// random = allowedDegrees[0];
    // } else {
	    var newRandom = Math.floor(Math.random() * actChords.length );
	    // while( (random === newRandom) || (allowedDegrees.indexOf(newRandom) < 0)  ){
	    while( (actChord === newRandom)  ){
	    	newRandom = Math.floor(Math.random() * actChords.length );
	    }
	    actChord = newRandom;
    // }
    

    // Guitar samples only have whole powerchords, so no need to get note series
   	actNotes = actChords[actChord].notes;
    
    console.log("Chord Played: ", theory.getNames(actNotes));
    console.log("");

    playNotes(actNotes);

	actState = (actState +1) % states.length;
}

function stepShow () {
	var label = theory.generateLabel(actChords[actChord], actScale, actScaleType);
	var labelSplit = label.label.split("<br>");
    lblChordName.innerHTML = labelSplit[1] + " " + labelSplit[0];
    btnNext.innerText = "NEXT";
	actState = (actState +1) % states.length;
}

function repeat () {
	if (actNotes === undefined) {
		return console.log("No chord picked yet");
	}
	sampler.stopAllPlaying();
	clearTimeout(totCadence);
    
    console.log("Chord Played: ", theory.getNames(actNotes));
    console.log("");
    var notes = actChords[actChord].notes;
	playNotes(notes);
}

function next () {
	states[actState](actScale);
}

/**
 * Plays a chord based on a diatonic scale degree
 * @param  {number} base diatonic degree
 */
function playChord (notes) { 
		sampler.stopAllPlaying();
		clearTimeout(totCadence);
	    
	    console.log("Chord Played: ", theory.getNames(notes));
	    console.log("");
		playNotes(notes);
}

function playCadence () {

	sampler.stopAllPlaying();
	clearTimeout(totCadence);


	// Guitars only have whole chord samples, no need to get individual notes
	var tons = theory.getNotes(actScale[0], theory.chords[theory.scales[actScaleType].chordTypes[0]].notes);
	var subs = theory.getNotes(actScale[3], theory.chords[theory.scales[actScaleType].chordTypes[3]].notes);
	var doms = theory.getNotes(actScale[4], theory.chords[theory.scales[actScaleType].chordTypes[4]].notes);

	playNotes(tons);
	totCadence = setTimeout(function () {
		sampler.stopAllPlaying();
		playNotes(subs);
		totCadence = setTimeout(function () {
			sampler.stopAllPlaying();
			playNotes(doms);
			totCadence = setTimeout(function () {
				sampler.stopAllPlaying();
				playNotes(tons);
				totCadence = setTimeout(function () {
					sampler.stopAllPlaying();
				},510);
			},510);
		},510);
	},510);
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

function saveChordMatrix() {
	if (localStorage) {
		var cm2bSaved = {};
		if (localStorage.chordplayer) {
			cm2bSaved = JSON.parse(localStorage.chordplayer);
		}
		cm2bSaved.chordmatrix = chordmatrix;
		localStorage.chordplayer = JSON.stringify(cm2bSaved);
	}
}

function sortChords(a, b) {
    if (a.base === b.base) {
        return 0;
    }
    else {
        return (a.base < b.base) ? -1 : 1;
    }
}


// =============  Bindings

sctInstruments.onchange = function (sel) {
	var opts = [];

	for (var i = 0; i < sel.srcElement.options.length; i++) {
		if (sel.srcElement.options[i].selected) {
			opts.push(sel.srcElement.options[i].value);
		}
	}

	selectedInstruments = opts;
};

rngVolume.onchange = function (event) {
	console.log(event.value);
	sampler.setOnAllSamples("volume", event.value/100);
};

btnNext.onclick = function () {
	next();
};

btnRepeat.onclick = function () {
	repeat();
};

btnCadence.onclick = function () {
	playCadence();
};

btnInitExercise.onclick = function () {
	initExercise();
};

sctScale.onchange = function () {
	actScaleBase = this.value;
	var data2bSaved;
	if (localStorage) {
		if (localStorage.chordplayer) {
			data2bSaved = JSON.parse(localStorage.chordplayer);
		} else {
			data2bSaved = {};
		}
		data2bSaved.actScaleBase = actScaleBase;
		localStorage.chordplayer = JSON.stringify(data2bSaved);
	}

	actScale = theory.getNotes(theory.nns[actScaleBase], theory.scales.major.noteDistances);
	initChordtable();
};

var allBtn = document.getElementsByClassName("btn");
for (var i = 0; i < allBtn.length; i++) {
	allBtn[i].onkeyup = listenKybd;
}

function listenKybd (event) {
	if ([13, 32].indexOf(event.keyCode) > -1) {
		this.click();
	}
}

document.body.onkeydown = function (event) {
	var key = event.keyCode || event.which;
	if (key === undefined) {
		return console.log("Missing key");
	}

	if (key - 48 > actChords.length || key - 48 < 1) {
		return;
	}

	console.log();
	sampler.stopAllPlaying();
	var origborder = ctrChord.children[key-49].style.border;
	ctrChord.children[key-49].style.border = "2px solid black";
	setTimeout(function () {
		ctrChord.children[key-49].style.border = origborder;
	},100);
	var notes = actChords[key-49].notes;
	playNotes(notes);
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
