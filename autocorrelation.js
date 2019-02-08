/*jshint esversion: 6 */


const CORR_BUFFER_SIZE = 1024;
const CORR_MAX_SAMPLES = Math.floor(CORR_BUFFER_SIZE / 2);
const CORR_MIN_SAMPLES = 0;

const noteFrequencesObj = {
	0: ['D6', 1174.659], 
	1: ['C6#', 1108.731], 
	2: ['C6',  1046.502],
	3: ['B5', 987.7666],
	4: ['A5#', 932.3275],
	5: ['A5', 880],
	6: ['G5#', 830.6094],
	7: ['G5', 783.9909],
	8: ['F5#', 739.9888],
	9: ['F5', 698.4565],
	10: ['E5', 659.2551],
	11: ['D5#', 622.254],
	12: ['D5', 587.3295],
	13: ['C5#', 554.3653],
	14: ['C5',  523.2511],
	15: ['B4', 493.8833],
	16: ['A4#', 466.1638],
	17: ['A4', 440],
	18: ['G4#', 415.3047],
	19: ['G4', 391.9954],
	20: ['F4#', 369.9944],
	21: ['F4', 349.2282],
	22: ['E4', 329.6276],
	23: ['D4#', 311.127],
	24: ['D4', 293.6648],
	25: ['C4#', 277.1826],
	26: ['C4',  261.6256],
	27: ['B3', 246.9417],
	28: ['A3#', 233.0819],
	29: ['A3', 220],
	30: ['G3#', 207.6523],
	31: ['G3', 195.9977],
	32: ['F3#', 184.9972],
	33: ['F3', 174.6141],
	34: ['E3', 164.8138],
	35: ['D3#', 155.5635],
	36: ['D3', 146.8324],
	37: ['C3#', 138.5913],
	38: ['C3', 130.8128],
	39: ['B2', 123.4708],
	40: ['A2#', 116.5409],
	41: ['A2', 110],
	42: ['G2#', 103.8262],
	43: ['G2', 97.99886],
	44: ['F2#', 92.49861],
	45: ['F2', 87.30706],
	46: ['E2', 82.40689]};


const findNote = (noteFrequencesObj, freq) => {

	let curr = noteFrequencesObj[Object.keys(noteFrequencesObj)[0]][1];
	let diff = Math.abs(freq - curr);
	let noteKey = noteFrequencesObj[Object.keys(noteFrequencesObj)[0]][0];

	let label = 0;
	
	for (let key in noteFrequencesObj) {

		let newdiff = Math.abs(freq - noteFrequencesObj[key][1]);
		if (newdiff < diff) {
		
			diff = newdiff;
			curr = noteFrequencesObj[key][1];
			noteKey = noteFrequencesObj[key][0];
			label = key;
		}
		
	}

	return [noteKey, curr, label];
};
const autoCorrelate = (audioCtx, corrBuffer) => {
	let bestOffset = -1;
	let bestCorrelation = 0;
	let rootMeanSquare = 0;
	let foundGoodCorrelation = false;
	let correlations = new Array(CORR_MAX_SAMPLES);
	let sampleRate = audioCtx.sampleRate;

	for (let i = 0; i < CORR_BUFFER_SIZE; i++) {
		let val = corrBuffer[i];
		rootMeanSquare += val * val;
	}

	rootMeanSquare = Math.sqrt(rootMeanSquare / CORR_BUFFER_SIZE);

	if (rootMeanSquare < 0.01) {
		return -1;
	}

	let lastCorrelation = 1;

	for (let offset = CORR_MIN_SAMPLES; offset < CORR_MAX_SAMPLES; offset++) {
		let correlation = 0;

		for (let i = 0; i < CORR_MAX_SAMPLES; i++) {
			correlation += Math.abs(corrBuffer[i] - corrBuffer[i + offset]);
		}

		correlation = 1 - (correlation / CORR_MAX_SAMPLES);
		correlations[offset] = correlation;

		if ((correlation > 0.9) && (correlation > lastCorrelation)) {
			foundGoodCorrelation = true;
			if (correlation > bestCorrelation) {
				bestCorrelation = correlation;
				bestOffset = offset;
			}
		} else if (foundGoodCorrelation) {
			let shift = (correlations[bestOffset + 1] - correlations[bestOffset - 1]) / correlations[bestOffset];
			return sampleRate / (bestOffset + (8 * shift));
		}

		lastCorrelation = correlation;
	}

	if (bestCorrelation > 0.01) {
		return sampleRate / bestOffset;
	}

	return -1;
};


	

export {
	CORR_BUFFER_SIZE,
	CORR_MAX_SAMPLES,
	CORR_MIN_SAMPLES,
	autoCorrelate,
	noteFrequencesObj,
	findNote
};