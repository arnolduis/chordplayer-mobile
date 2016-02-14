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
