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