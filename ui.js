/*jshint esversion: 6 */


// HTML element declaration

export const video = document.querySelector('video');
export const hyperParams = document.getElementsByClassName('hyper-params');
export const trainAndPredictBtn = document.getElementsByClassName('trainAndPredictBtns');
export const dataCollectionBtn = document.getElementById('data');
export const descHeader = document.getElementById('desc');
export const collectedNotesHeader = document.getElementById('collectedNotesHeader');
const latestImageCanvas = document.getElementById('latestImage');
const latestImageCanvasCtx = latestImageCanvas.getContext('2d');
const noteCollection = document.getElementById('noteCollection');
const imagesOfCollectedNotes = document.getElementById('imagesOfCollectedNotes');



export const drawLatestImage = (imageData, data) => {
	const [width, height] = [224, 224];
	
	for (let i = 0; i < height * width; ++i) {
		const j = i * 4;
		imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
		imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
		imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
		imageData.data[j + 3] = 255;
	}
	latestImageCanvasCtx.putImageData(imageData, 0, 0);
	
	
};



export const addImageToCollectedNotes = (imageData, data, note) => {

	const imageCanvas = document.createElement('canvas');
	imageCanvas.className = 'canvasCollection';
	const imageDesc = document.createElement('p');
	imageDesc.innerHTML = note[0] + ' ' + note[1] + ' label: ' + note[2];
	noteCollection.innerHTML += note[0] + ' ' + note[1] + '<br>';
	const imageCanvasCtx = imageCanvas.getContext('2d');
	
	imageCanvas.height = 224;
	imageCanvas.width = 224;
	const [width, height] = [224, 224];
	
	for (let i = 0; i < height * width; ++i) {
		const j = i * 4;
		imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
		imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
		imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
		imageData.data[j + 3] = 255;
	}
	
	
	imageCanvasCtx.putImageData(imageData, 0, 0);
	imageCanvasCtx.font = '30px serif';
	imageCanvasCtx.fillStyle = 'white';
  	imageCanvasCtx.fillText(note[0] + ' ' + Math.floor(note[1]) + ' HZ', 10, 30);
	/*const img = document.createElement('img');
	img.src = imageCanvas.toDataURL("image/png");
	imagesOfCollectedNotes.appendChild(img);*/
	imagesOfCollectedNotes.appendChild(imageCanvas);
	//imagesOfCollectedNotes.innerHTML += '</br>';
	//imagesOfCollectedNotes.appendChild(imageDesc);
};


const trainStatusElement = document.getElementById('train-status');

export const trainStatus = (status) => {
	trainStatusElement.innerText = status;
	descHeader.innerText = status;
};

// Set hyper params from UI values.
const learningRateElement = document.getElementById('learningRate');
export const getLearningRate = () => +learningRateElement.value;

const batchSizeFractionElement = document.getElementById('batchSizeFraction');
export const getBatchSizeFraction = () => +batchSizeFractionElement.value;

const epochsElement = document.getElementById('epochs');
export const getEpochs = () => +epochsElement.value;

const denseUnitsElement = document.getElementById('dense-units');
export const getDenseUnits = () => +denseUnitsElement.value;





export const isPredicting = () => {
	descHeader.innerText = 'Predicting';
};

export const donePredicting = () => {
	statusElement.style.visibility = 'hidden';
};

export const updateStatus = (text) => {
	descHeader.innerText = text;
}