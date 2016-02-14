var utils = require("./utils");
var theory = require("./theory")();

module.exports = function (sampler) {
			

	var actMelody = [{note: 0 }];
	var actMelodyNote = {note: 0 };
	var actScaleBase = "C";
	var actScaleType = "major";
	var actScale = theory.getNotesByName(actScaleBase, actScaleType);
	var actCadenceNotes = [0];
	var totsMelody = [];
	var totsCadence = [];
	var cadenceSpeed = 500;
	var selectedInstruments = ["piano"];

	// localData = localStorage && localStorage.melodictator && JSON.parse(localStorage.melodictator);

	function playMelody (melody) {
		if (melody === undefined) {
			return console.log("Melody undefined");
		}
		stopMelody();
		playNotes(melody[0].note, selectedInstruments);
		actMelodyNote = melody[0];
		function ivlFunc(melody, j, timeout) {
			totsMelody.push(setTimeout(function () {
				sampler.stopNotes(melody[j - 1].note, "piano");
				if (melody.length !== j) {
					actMelodyNote = melody[j];
					playNotes(melody[j].note, selectedInstruments);
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
		totsMelody = [];
	}

	function playCadence (args) {
		if (args !== undefined && args.object !==   undefined) {
			//TODOVM
			// falshButton(args);
		}
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

	function generateMelody (melodyLength, melodySpeed, maxInterval) {
		if (isNaN(melodyLength) || isNaN(melodySpeed) || isNaN(maxInterval)) {
			return console.log("Inputs are NaN");
		}

		//TODO
		if (typeof melodySpeed === "string") {
			melodySpeed = parseInt(melodySpeed);
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
			var nextAbs = melody[i].note + interval;

			// while(  nextAbs < 0 || nextAbs > 11) {
			//     interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);
			//     nextAbs = melody[i].note + interval;
			// }

			while(  0 > nextAbs || nextAbs > 11 ||
				(interval >= 0 && (actScale[melody[i].relative] > actScale[melody[i].relative + interval])) ||
				(interval <  0 && (actScale[melody[i].relative] < actScale[melody[i].relative + interval]))) {
				interval = utils.getRandomInt(-maxInterval + 1, maxInterval - 1);
				nextAbs = melody[i].note + interval;
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

	function showMelody() {
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

		return noteNames;
	}

	function stepPlay(args) {
		var melodyLength = args.melodyLength;
		var melodySpeed = args.melodySpeed;
		var maxInterval = args.maxInterval;

		if (!melodyLength || !melodySpeed || !maxInterval) {
			return console.log("Missing step parameters");
		}

		actScaleBase = utils.getRandomInt(0,11);
		actScale = theory.getNotesByName(theory.nns[actScaleBase], actScaleType);
		playCadence();
		//TODO
		actMelody = generateMelody(melodyLength, melodySpeed, maxInterval);
		setTimeout(function () {
		    playMelody(actMelody);
		}, 4 * cadenceSpeed + 50);
	}

	function repeat(args) {
		//TODOVM
		// falshButton(args);

		console.log("Repeat");
		sampler.stopNotes(actMelodyNote.note, "piano");
		stopMelody();   
		playMelody(actMelody);
	}

	function stop(args) {
		sampler.stopNotes(actMelodyNote.note, "piano");
		stopMelody();
	}

	// Interface
	return {
		playCadence: playCadence,
		showMelody: showMelody,
		stepPlay: stepPlay,
		repeat: repeat,
		stop: stop
	};
};
