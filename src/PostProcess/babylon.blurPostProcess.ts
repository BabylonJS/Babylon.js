module BABYLON {
    export class BlurPostProcess extends PostProcess {
		protected _kernel: number;
		protected _idealKernel: number;
		protected _packedFloat: boolean	= false;

		/**
		 * Sets the length in pixels of the blur sample region
		 */
		public set kernel(v: number) {
			if (this._idealKernel === v) {
				return;
			}

			v = Math.max(v, 1);
			this._idealKernel = v;
			this._kernel = this._nearestBestKernel(v);
            this._updateParameters();
		}

		/**
		 * Gets the length in pixels of the blur sample region
		 */
		public get kernel(): number {
			return this._idealKernel;
		}

		/**
		 * Sets wether or not the blur needs to unpack/repack floats
		 */
		public set packedFloat(v: boolean) {
			if (this._packedFloat === v) {
				return;
			}
			this._packedFloat = v;
            this._updateParameters();
		}

		/**
		 * Gets wether or not the blur is unpacking/repacking floats
		 */
		public get packedFloat(): boolean {
			return this._packedFloat;
		}

        constructor(name: string, public direction: Vector2, kernel: number, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, reusable?: boolean, textureType: number = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(name, "kernelBlur", ["delta", "direction"], null, options, camera, samplingMode, engine, reusable, null, textureType, "kernelBlur", {varyingCount: 0, depCount: 0}, true);
            this.onApplyObservable.add((effect: Effect) => {
                effect.setFloat2('delta', (1 / this.width) * this.direction.x, (1 / this.height) * this.direction.y);
            });

            this.kernel = kernel;
        }

        protected _updateParameters(): void {
            // Generate sampling offsets and weights
			let N = this._kernel;
			let centerIndex = (N - 1) / 2;

			// Generate Gaussian sampling weights over kernel
			let offsets = [];
			let weights = [];
			let totalWeight = 0;
			for (let i = 0; i < N; i++) {
				let u = i / (N - 1);
				let w = this._gaussianWeight(u * 2.0 - 1);
				offsets[i] = (i - centerIndex);
				weights[i] = w;
				totalWeight += w;
			}

			// Normalize weights
			for (let i = 0; i < weights.length; i++) {
				weights[i] /= totalWeight;
			}

			// Optimize: combine samples to take advantage of hardware linear sampling
			// Walk from left to center, combining pairs (symmetrically)
			let linearSamplingWeights = [];
			let linearSamplingOffsets = [];

			let linearSamplingMap = [];

			for (let i = 0; i <= centerIndex; i += 2) {
				let j = Math.min(i + 1, Math.floor(centerIndex));

				let singleCenterSample = i === j;

				if (singleCenterSample) {
					linearSamplingMap.push({ o: offsets[i], w: weights[i] });
				} else {
					let sharedCell = j === centerIndex;

					let weightLinear = (weights[i] + weights[j] * (sharedCell ? .5 : 1.));
					let offsetLinear = offsets[i] + 1 / (1 + weights[i] / weights[j]);

					if (offsetLinear === 0) {
						linearSamplingMap.push({ o: offsets[i], w: weights[i] });
						linearSamplingMap.push({ o: offsets[i + 1], w: weights[i + 1] });
					} else {
						linearSamplingMap.push({ o: offsetLinear, w: weightLinear });
						linearSamplingMap.push({ o: -offsetLinear, w: weightLinear });
					}

				}
			}

			for (let i = 0; i < linearSamplingMap.length; i++) {
				linearSamplingOffsets[i] = linearSamplingMap[i].o;
				linearSamplingWeights[i] = linearSamplingMap[i].w;
			}

			// Replace with optimized
			offsets = linearSamplingOffsets;
			weights = linearSamplingWeights;

			// Generate shaders
			let maxVaryingRows = this.getEngine().getCaps().maxVaryingVectors;
			let freeVaryingVec2 = Math.max(maxVaryingRows, 0.) - 1; // Because of sampleCenter

            let varyingCount = Math.min(offsets.length, freeVaryingVec2);
        
            let defines = "";
            for (let i = 0; i < varyingCount; i++) {
                defines += `#define KERNEL_OFFSET${i} ${this._glslFloat(offsets[i])}\r\n`;
                defines += `#define KERNEL_WEIGHT${i} ${this._glslFloat(weights[i])}\r\n`;
			}

            let depCount = 0;
            for (let i = freeVaryingVec2; i < offsets.length; i++) {
                defines += `#define KERNEL_DEP_OFFSET${depCount} ${this._glslFloat(offsets[i])}\r\n`;
                defines += `#define KERNEL_DEP_WEIGHT${depCount} ${this._glslFloat(weights[i])}\r\n`;
                depCount++;
			}

			if (this.packedFloat) {
				defines += `#define PACKEDFLOAT 1`;
			}

            this.updateEffect(defines, null, null, {
				varyingCount: varyingCount,
				depCount: depCount
			});
        }

        /**
		 * Best kernels are odd numbers that when divided by 2, their integer part is even, so 5, 9 or 13.
		 * Other odd kernels optimize correctly but require proportionally more samples, even kernels are
		 * possible but will produce minor visual artifacts. Since each new kernel requires a new shader we
		 * want to minimize kernel changes, having gaps between physical kernels is helpful in that regard.
		 * The gaps between physical kernels are compensated for in the weighting of the samples
		 * @param idealKernel Ideal blur kernel.
		 * @return Nearest best kernel.
		 */
		protected _nearestBestKernel(idealKernel: number): number {
			let v = Math.round(idealKernel);
			for (let k of [v, v - 1, v + 1, v - 2, v + 2]) {
				if (((k % 2) !== 0) && ((Math.floor(k / 2) % 2) === 0) && k > 0) {
					return Math.max(k, 3);
				}
			}
			return Math.max(v, 3);
		}

		/**
		 * Calculates the value of a Gaussian distribution with sigma 3 at a given point.
		 * @param x The point on the Gaussian distribution to sample.
		 * @return the value of the Gaussian function at x.
		 */
		protected _gaussianWeight(x: number): number {
			//reference: Engine/ImageProcessingBlur.cpp #dcc760
			// We are evaluating the Gaussian (normal) distribution over a kernel parameter space of [-1,1],
			// so we truncate at three standard deviations by setting stddev (sigma) to 1/3.
			// The choice of 3-sigma truncation is common but arbitrary, and means that the signal is
			// truncated at around 1.3% of peak strength.

			//the distribution is scaled to account for the difference between the actual kernel size and the requested kernel size
			let sigma = (1 / 3);
			let denominator = Math.sqrt(2.0 * Math.PI) * sigma;
			let exponent = -((x * x) / (2.0 * sigma * sigma));
			let weight = (1.0 / denominator) * Math.exp(exponent);
			return weight;
		}      

       /**
		 * Generates a string that can be used as a floating point number in GLSL.
		 * @param x Value to print.
		 * @param decimalFigures Number of decimal places to print the number to (excluding trailing 0s).
		 * @return GLSL float string.
		 */
		protected _glslFloat(x: number, decimalFigures = 8) {
			return x.toFixed(decimalFigures).replace(/0+$/, '');
		}      
    }
} 