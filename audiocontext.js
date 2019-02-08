/*jshint esversion: 6 */

export const createAudioContext = (stream) => {


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
	let pitchArr = [];

	// JavascriptNode loops audio input.
	// Here frequencies are catched
	javascriptNode.onaudioprocess = () => {

		if (collectingData) {

			const corrBuffer = new Float32Array(CORR_BUFFER_SIZE);
			analyser.getFloatTimeDomainData(corrBuffer);

			let roundedPitch = autoCorrelate(audioCtx, corrBuffer);
			roundedPitch = roundedPitch === -1 ? -1 : roundedPitch.toFixed(2);

			if (roundedPitch !== -1 && roundedPitch < 1175) {
				note = findNote(noteFrequencesObj, roundedPitch);
			}

			if (note[1] !== -1) {

				if (note[1] === lastPitch) {

					index++;

					if (index > 2) {

					
						tf.tidy(() => {
							const img = webcam.capture();
							dataset.addExample(mobilenet.predict(img), note[2]);

							const [width, height] = [224, 224];
							const imageData = new ImageData(width, height);
							const data = img.dataSync();
							for (let i = 0; i < height * width; ++i) {
								const j = i * 4;
								imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
								imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
								imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
								imageData.data[j + 3] = 255;
							}
							ctx.putImageData(imageData, 0, 0);
							descHeader.innerHTML = note[0] + ' ' + note[1] + ' label: ' + note[2];
							index = 0;

						});
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
		}

	};
};