namespace BABYLON {

	/**
	 * Performance monitor tracks rolling average frame-time and frame-time variance over a user defined sliding-window
	 */
	export class PerformanceMonitor {

		private _enabled: boolean = true;
		private _rollingFrameTime: RollingAverage;
		private _lastFrameTimeMs: Nullable<number>;
		private _lastChangeTimeMs: Nullable<number>;

		/**
		 * constructor
		 * @param frameSampleSize The number of samples required to saturate the sliding window
		 */
		constructor(frameSampleSize: number = 30) {
			this._rollingFrameTime = new RollingAverage(frameSampleSize);
		}

		/**
		 * Samples current frame
		 * @param timeMs A timestamp in milliseconds of the current frame to compare with other frames
		 */
		public sampleFrame(timeMs: number = Tools.Now) {
			if (!this._enabled) return;

			if (this._lastFrameTimeMs != null) {
				let dt = timeMs - this._lastFrameTimeMs;
				this._rollingFrameTime.add(dt);
			}

			this._lastFrameTimeMs = timeMs;
		}

		/**
		 * Returns the average frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
		 * @return Average frame time in milliseconds
		 */
		public get averageFrameTime(): number {
			return this._rollingFrameTime.average;
		}

		/**
		 * Returns the variance frame time in milliseconds over the sliding window (or the subset of frames sampled so far)
		 * @return Frame time variance in milliseconds squared
		 */
		public get averageFrameTimeVariance(): number {
			return this._rollingFrameTime.variance;
		}

		/**
		 * Returns the frame time of the most recent frame
		 * @return Frame time in milliseconds
		 */
		public get instantaneousFrameTime(): number {
			return this._rollingFrameTime.history(0);
		}

		/**
		 * Returns the average framerate in frames per second over the sliding window (or the subset of frames sampled so far)
		 * @return Framerate in frames per second
		 */
		public get averageFPS(): number {
			return 1000.0 / this._rollingFrameTime.average;
		}

		/**
		 * Returns the average framerate in frames per second using the most recent frame time
		 * @return Framerate in frames per second
		 */
		public get instantaneousFPS(): number {
			let history = this._rollingFrameTime.history(0);

			if (history === 0) {
				return 0;
			}

			return 1000.0 / history;
		}

		/**
		 * Returns true if enough samples have been taken to completely fill the sliding window
		 * @return true if saturated
		 */
		public get isSaturated(): boolean {
			return this._rollingFrameTime.isSaturated();
		}

		/**
		 * Enables contributions to the sliding window sample set
		 */
		public enable() {
			this._enabled = true;
		}

		/**
		 * Disables contributions to the sliding window sample set
		 * Samples will not be interpolated over the disabled period
		 */
		public disable() {
			this._enabled = false;
			//clear last sample to avoid interpolating over the disabled period when next enabled
			this._lastFrameTimeMs = null;
			this._lastChangeTimeMs = null;
		}

		/**
		 * Returns true if sampling is enabled
		 * @return true if enabled
		 */
		public get isEnabled(): boolean {
			return this._enabled;
		}

		/**
		 * Resets performance monitor
		 */
		public reset() {
			//clear last sample to avoid interpolating over the disabled period when next enabled
			this._lastFrameTimeMs = null;
			this._lastChangeTimeMs = null;
			//wipe record
			this._rollingFrameTime.reset();
		}

	}

	/**
	 * RollingAverage
	 *
	 * Utility to efficiently compute the rolling average and variance over a sliding window of samples
	 */
	export class RollingAverage {

		/**
		 * Current average
		 */
		public average: number;
		/**
		 * Current variance
		 */
		public variance: number;

		protected _samples: Array<number>;
		protected _sampleCount: number;
		protected _pos: number;
		protected _m2: number;//sum of squares of differences from the (current) mean

		/**
		 * constructor
		 * @param length The number of samples required to saturate the sliding window
		 */
		constructor(length: number) {
			this._samples = new Array<number>(length);
			this.reset();
		}

		/**
		 * Adds a sample to the sample set
		 * @param v The sample value
		 */
		public add(v: number) {
			//http://en.wikipedia.org/wiki/Algorithms_for_calculating_variance
			let delta: number;

			//we need to check if we've already wrapped round
			if (this.isSaturated()) {
				//remove bottom of stack from mean
				let bottomValue = this._samples[this._pos];
				delta = bottomValue - this.average;
				this.average -= delta / (this._sampleCount - 1);
				this._m2 -= delta * (bottomValue - this.average);
			} else {
				this._sampleCount++;
			}

			//add new value to mean
			delta = v - this.average;
			this.average += delta / (this._sampleCount);
			this._m2 += delta * (v - this.average);

			//set the new variance
			this.variance = this._m2 / (this._sampleCount - 1);

			this._samples[this._pos] = v;
			this._pos++;

			this._pos %= this._samples.length;//positive wrap around
		}

		/**
		 * Returns previously added values or null if outside of history or outside the sliding window domain
		 * @param i Index in history. For example, pass 0 for the most recent value and 1 for the value before that
		 * @return Value previously recorded with add() or null if outside of range
		 */
		public history(i: number): number {
			if ((i >= this._sampleCount) || (i >= this._samples.length)) {
				return 0;
			}

			let i0 = this._wrapPosition(this._pos - 1.0);
			return this._samples[this._wrapPosition(i0 - i)];
		}

		/**
		 * Returns true if enough samples have been taken to completely fill the sliding window
		 * @return true if sample-set saturated
		 */
		public isSaturated(): boolean {
			return this._sampleCount >= this._samples.length;
		}

		/**
		 * Resets the rolling average (equivalent to 0 samples taken so far)
		 */
		public reset() {
			this.average = 0;
			this.variance = 0;
			this._sampleCount = 0;
			this._pos = 0;
			this._m2 = 0;
		}

		/**
		 * Wraps a value around the sample range boundaries
		 * @param i Position in sample range, for example if the sample length is 5, and i is -3, then 2 will be returned.
		 * @return Wrapped position in sample range
		 */
		protected _wrapPosition(i: number): number {
			let max = this._samples.length;
			return ((i % max) + max) % max;
		}

	}

}