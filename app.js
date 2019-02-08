/*jshint esversion: 6 */

import {
	Webcam
} from './webcam.js';

import {
	Dataset
} from './dataset.js';

import {
	CORR_BUFFER_SIZE,
	CORR_MAX_SAMPLES,
	CORR_MIN_SAMPLES,
	autoCorrelate,
	noteFrequencesObj,
	findNote
} from './autocorrelation.js';

import * as ui from './ui.js';

// The number of classes we want to predict. This is fixed to amount of notes existing on a electric guitar 
const NUM_CLASSES = 47;

// A webcam class that generates Tensors from the images from the webcam.
const webcam = new Webcam(document.getElementById('webcam'));

// The dataset object where we will store activations.
const dataset = new Dataset(NUM_CLASSES);

// Constant for maximum examples per note
const numExamples = 70;
ui.collectedNotesHeader.innerHTML += ' ' + numExamples + ' per note)';

let audioCtx;

let stream;

// Loads mobilenet and returns a model that returns the internal activation
// we'll use as input to our classifier model.
async function loadMobilenet() {
	const mobilenet = await tf.loadModel(
		'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');

	// Return a model that outputs an internal activation.
	const layer = mobilenet.getLayer('conv_pw_13_relu');
	return tf.model({
		inputs: mobilenet.inputs,
		outputs: layer.output
	});
}


// Boolean for changing output oscillator/ mic output
let oscillatorOutput = false;

let collectingData = false;

// Model variable declaration
let mobilenetInternalActivations;
let model;

// Object keeping track of the amount of the notes collected
const imageDataObj = [];

ui.dataCollectionBtn.addEventListener('click', () => {
	if (collectingData) {

		collectingData = false;
		ui.dataCollectionBtn.innerHTML = 'Collect Data';
		ui.hyperParams[0].style.display = 'block';
		ui.trainAndPredictBtn[0].style.display = 'block';
	} else {

		collectingData = true;
		ui.dataCollectionBtn.innerHTML = 'Stop Collecting Data';
		collectData(stream);
	}
});

const collectData = (stream) => {

	createAudioContext(stream);

};

const createAudioContext = (stream) => {

	// Create a MediaStreamAudioSourceNode
	// Feed the HTMLMediaElement into it
	audioCtx = new AudioContext();
	const source = audioCtx.createMediaStreamSource(stream);

	// setup a analyzer
	const analyser = audioCtx.createAnalyser();
	analyser.smoothingTimeConstant = 0.5;
	analyser.fftSize = 2048;

	let javascriptNode = audioCtx.createScriptProcessor(2048, 1, 1);

	// connect the source to the analyser
	source.connect(analyser);
	// Analyser is connected to javascriptNode to analyse signal frequencies in loop (javascriptNode.onaudioprocess)
	analyser.connect(javascriptNode);
	// connect to destination, else it isn't called
	javascriptNode.connect(audioCtx.destination);

	const oscillator = audioCtx.createOscillator();
	oscillator.type = 'square';
	oscillator.connect(audioCtx.destination);
	oscillator.start();


	let lastPitch = -1;
	let index = 0;
	let note = [null, -1];




	// Input audio is processed in javascriptNode.
	javascriptNode.onaudioprocess = () => {


		if (collectingData) {

			// Array into which audio input data is gathered
			const corrBuffer = new Float32Array(CORR_BUFFER_SIZE);

			// Input data from analyzernode is put to array
			analyser.getFloatTimeDomainData(corrBuffer);

			//Pitch is calculates in autoCorrelate function
			let roundedPitch = autoCorrelate(audioCtx, corrBuffer);
			roundedPitch = roundedPitch === -1 ? -1 : roundedPitch.toFixed(2);

			// Check that pitch is found and it's on a guitar scale
			if (roundedPitch !== -1 && roundedPitch < 1175) {

				// Nearest note of the pitch is calculated
				note = findNote(noteFrequencesObj, roundedPitch);
			} else {

				// If pitch is not desirable, note is assigned with initial value
				note = [null, -1];
			}

			// If note is found...
			if (note[1] !== -1) {

				// ... Check if note is same as previous time
				if (note[1] === lastPitch) {

					index++;



					// If index is big enough can be assumed that pitch is stable and propably correct
					if (index > 2) {

						// If imageDataObj doesn't already have note property, one is created with an empty array
						if (!imageDataObj.hasOwnProperty(note[0])) {
							imageDataObj[note[0]] = [];

							tf.tidy(() => {

								// Here image is captured from video stream into a tensor
								const imgTensor = webcam.capture();

								// Tensor is added to dataset. Here the error occurs
								dataset.addExample(mobilenetInternalActivations.predict(imgTensor), note[2]);

								//Image is reconstructed from imgTensor
								const [width, height] = [224, 224];
								const imageData = new ImageData(width, height);
								const data = imgTensor.dataSync();
								imageDataObj[note[0]].push(data);
								ui.drawLatestImage(imageData, data);


								ui.descHeader.innerHTML = note[0] + '<br> ' + note[1] + ' Hz';
								index = 0;

							});
						} else {


							if (imageDataObj[note[0]].length < numExamples) {
								tf.tidy(() => {

									// Here image is captured from video stream into a tensor
									const imgTensor = webcam.capture();

									// Tensor is added to dataset. Here the error occurs
									dataset.addExample(mobilenetInternalActivations.predict(imgTensor), note[2]);

									//Image is reconstructed from imgTensor
									const [width, height] = [224, 224];
									const imageData = new ImageData(width, height);
									const data = imgTensor.dataSync();
									imageDataObj[note[0]].push(data);


									ui.descHeader.innerHTML = note[0] + '<br> ' + note[1] + ' Hz';
									index = 0;
									

									ui.drawLatestImage(imageData, data);

									// If true print reconstructed image to webpage
									if (imageDataObj[note[0]].length === numExamples - 1) {
										ui.addImageToCollectedNotes(imageData, data, note);
									}

								});

							} else {

								ui.descHeader.innerHTML = note[0] + '<br> ' + note[1] + ' Hz ';
								index = 0;
							}
						}

					}
				} else {
					index = 0;
					oscillator.frequency.value = note[1];
				}
			}

			if (note[1] !== lastPitch) {
				lastPitch = note[1];
			}

		} else {
			// connect the source to the analyser
			source.disconnect(analyser);
			// Analyser is connected to javascriptNode to analyse signal frequencies in loop (javascriptNode.onaudioprocess)
			analyser.disconnect(javascriptNode);

			oscillator.disconnect(audioCtx.destination);
			// connect to destination, else it isn't called
			javascriptNode.disconnect(audioCtx.destination);


		
			localStorage.setItem('data', JSON.stringify(imageDataObj));


		}

	};
};


/**
 * Sets up and trains the classifier.
 */
async function train() {
	if (dataset.xs == null) {
		throw new Error('Add some examples before training!');
	}

	// Creates a 2-layer fully connected model. By creating a separate model,
	// rather than adding layers to the mobilenet model, we "freeze" the weights
	// of the mobilenet model, and only train weights from the new model.
	model = tf.sequential({
		layers: [
			// Flattens the input to a vector so we can use it in a dense layer. While
			// technically a layer, this only performs a reshape (and has no training
			// parameters).
			tf.layers.flatten({
				inputShape: [7, 7, 256]
			}),
			// Layer 1
			tf.layers.dense({
				units: ui.getDenseUnits(),
				activation: 'relu',
				kernelInitializer: 'varianceScaling',
				useBias: true
			}),
			// Layer 2. The number of units of the last layer should correspond
			// to the number of classes we want to predict.
			tf.layers.dense({
				units: NUM_CLASSES,
				kernelInitializer: 'varianceScaling',
				useBias: false,
				activation: 'softmax'
			})
		]
	});

	// Creates the optimizers which drives training of the model.
	const optimizer = tf.train.adam(ui.getLearningRate());
	// We use categoricalCrossentropy which is the loss function we use for
	// categorical classification which measures the error between our predicted
	// probability distribution over classes (probability that an input is of each
	// class), versus the label (100% probability in the true class)>
	model.compile({
		optimizer: optimizer,
		loss: 'categoricalCrossentropy'
	});

	

	//dataset.concatCurrentPatch();

	const batchSize =
		Math.floor(dataset.xs.shape[0] * ui.getBatchSizeFraction());
	console.log(batchSize);
	if (!(batchSize > 0)) {
		throw new Error(
			`Batch size is 0 or NaN. Please choose a non-zero fraction.`);
	}

	// Train the model! Model.fit() will shuffle xs & ys so we don't have to.
	/*await model.fit(dataset.xs, dataset.ys, {
		batchSize,
		epochs: ui.getEpochs(),
		callbacks: {
			onBatchEnd: async(batch, logs) => {
				ui.trainStatus('Loss: ' + logs.loss.toFixed(5));
			}
		}
	});*/


	/*
	
	const concatTensorx = dataset.tensorArray[0][0].concat(dataset.tensorArray[1][0], 0);
	const concatTensory = dataset.tensorArray[0][1].concat(dataset.tensorArray[1][1], 0);
	*/

	/*await model.fit(dataset.xs, dataset.ys, {
	    batchSize,
	    epochs: ui.getEpochs(),
	    callbacks: {
	        onBatchEnd: async(batch, logs) => {
	            ui.trainStatus('Loss: ' + logs.loss.toFixed(5));
	        }
	    }
	});*/

	await model.fit(dataset.xs, dataset.ys, {
		batchSize,
		epochs: ui.getEpochs(),
		callbacks: {
			onBatchEnd: async(batch, logs) => {
				ui.trainStatus('Loss: ' + logs.loss.toFixed(5));
			}
		}
	});
	/*for (let tensor of dataset.tensorArray) {

	    
	    const batchSize = Math.floor(tensor[0].shape[0] * ui.getBatchSizeFraction());
	    
	    if (!(batchSize > 0)) {
	        throw new Error(
	            `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
	    }
	    // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
	    await model.fit(tensor[0], tensor[1], {
	        batchSize,
	        epochs: ui.getEpochs(),
	        callbacks: {
	            onBatchEnd: async(batch, logs) => {
	                ui.trainStatus('Loss: ' + logs.loss.toFixed(5));
	            }
	        }
	    });
	};*/
}

let isPredicting = false;

async function predict() {

	const oscillator = audioCtx.createOscillator();
	oscillator.type = 'square';
	oscillator.connect(audioCtx.destination);
	oscillator.start();
	ui.isPredicting();
	while (isPredicting) {
		const predictedClass = tf.tidy(() => {
			// Capture the frame from the webcam.
			const img = webcam.capture();

			// Make a prediction through mobilenet, getting the internal activation of
			// the mobilenet model.
			const activation = mobilenetInternalActivations.predict(img);

			// Make a prediction through our newly-trained model using the activation
			// from mobilenet as input.
			const predictions = model.predict(activation);
		

			// Returns the index with the maximum probability. This number corresponds
			// to the class the model thinks is the most probable given the input.
			return predictions.as1D().argMax();
		});

		const classId = (await predictedClass.data())[0];
		predictedClass.dispose();

		
		oscillator.frequency.value = noteFrequencesObj[classId][1];
		ui.descHeader.innerHTML = 'Prediction: <br>' + noteFrequencesObj[classId][0] + ' ' + noteFrequencesObj[classId][1] + ' HZ';
		await tf.nextFrame();
	}
	ui.donePredicting();
}

document.getElementById('train').addEventListener('click', async() => {
	ui.trainStatus('Training...');
	await tf.nextFrame();
	await tf.nextFrame();
	isPredicting = false;
	train();
});

document.getElementById('predict').addEventListener('click', () => {
	isPredicting = true;
	predict();
});

async function init() {
	try {
		stream = await webcam.setup();
		
	} catch (e) {
		// document.getElementById('no-webcam').style.display = 'block';
		console.log('Webcam setup failed: ' + e);
	}

	mobilenetInternalActivations = await loadMobilenet();


	// Warm up the model. This uploads weights to the GPU and compiles the WebGL
	// programs so the first time we collect data from the webcam it will be
	// quick.
	tf.tidy(() => mobilenetInternalActivations.predict(webcam.capture()));
	ui.updateStatus('Ready to collect data!');
	//ui.init();
	
}

init();