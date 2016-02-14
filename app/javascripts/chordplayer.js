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