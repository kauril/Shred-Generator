/*jshint esversion: 6 */

export class Dataset {

	constructor(numClasses) {
		this.numClasses = numClasses;

		this.concatXs = null;
		this.concatYs = null;
		this.index = 0;
	}



	/**
	 * Adds an example to the  dataset.
	 * @param {Tensor} example A tensor representing the example. It can be an image,
	 *     an activation, or any other type of Tensor.
	 * @param {number} label The label of the example. Should be a number.
	 */
	addExample(example, label) {
		// One-hot encode the label.

		const y = tf.tidy(() => tf.oneHot(tf.tensor1d([label]).toInt(), this.numClasses));

		if (this.xs == null) {

			
			// For the first example that gets added, keep example and y so that the
			// ControllerDataset owns the memory of the inputs. This makes sure that
			// if addExample() is called in a tf.tidy(), these Tensors will not get
			// disposed.
			this.xs = tf.keep(example);
			this.ys = tf.keep(y);
			
		} else {

			
			/*	if (this.xs.size > 200000) {
				
				const oldX = this.xs;

				this.xs = tf.keep(oldX.concat(example, 0));

				const oldY = this.ys;
				this.ys = tf.keep(oldY.concat(y, 0));

				if (this.concatXs === null) {
				
					this.concatXs = tf.keep(this.xs);
					this.concatYs = tf.keep(this.ys);
					
				} else {

					
					const oldConcatX = this.concatXs;
					this.concatXs = tf.keep(oldConcatX.concat(this.xs, 0));

					const oldConcatY = this.concatYs;
					this.concatYs = tf.keep(oldConcatY.concat(this.ys, 0));

					
					oldConcatX.dispose();
					oldConcatY.dispose();
				}


	
			

				oldX.dispose();
				oldY.dispose();
				y.dispose();

       

        this.index++;

				//this.xs.dispose();
				//this.ys.dispose();
			
				this.xs = null;
				this.ys = null;
			
			} else {*/

			

			WebGLRenderingContext.prototype.shaderSource = function(origFn) {
				return function(shader, src) {
					console.log(src);
					origFn.call(this, shader, src);
				};
			}(WebGLRenderingContext.prototype.shaderSource);

			




			const oldX = this.xs;
			this.xs = tf.keep(tf.concat([oldX, example]));
			//WebGLRenderingContext.prototype.shaderSource();

			const oldY = this.ys;
			this.ys = tf.keep(tf.concat([oldY, y]));

			console.log(this.xs);

			oldX.dispose();
			oldY.dispose();
			y.dispose();
			//}
		}
	}


	concatCurrentPatch() {

		console.log('kurrennttii');
		console.log(this.concatXs);
		console.log(this.concatYs);
		const oldConcatX = this.concatXs;
		this.concatXs = tf.keep(oldConcatX.concat(this.xs, 0));

		const oldConcatY = this.concatYs;
		this.concatYs = tf.keep(oldConcatY.concat(this.ys, 0));

		console.log(this.concatXs);
		console.log(this.concatYs);
		oldConcatX.dispose();
		oldConcatY.dispose();
	}

}