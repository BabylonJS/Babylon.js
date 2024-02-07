/**
 * Class for generating 2D Halton sequences.
 * From https://observablehq.com/@jrus/halton
 */
export class Halton2DSequence {
    private _curIndex = 0;
    private _sequence: number[] = [];
    private _numSamples = 0;
    private _width: number;
    private _height: number;
    private _baseX;
    private _baseY;

    /**
     * The x coordinate of the current sample.
     */
    public readonly x = 0;

    /**
     * The y coordinate of the current sample.
     */
    public readonly y = 0;

    /**
     * Creates a new Halton2DSequence.
     * @param numSamples Number of samples in the sequence.
     * @param baseX The base for the x coordinate (default: 2).
     * @param baseY The base for the y coordinate (default: 3).
     * @param width Factor to scale the x coordinate by (default: 1). The scaling factor is 1/width.
     * @param height Factor to scale the y coordinate by (default: 1). The scaling factor is 1/height.
     */
    constructor(numSamples: number, baseX = 2, baseY = 3, width = 1, height = 1) {
        this._width = width;
        this._height = height;
        this._baseX = baseX;
        this._baseY = baseY;

        this._generateSequence(numSamples);
        this.next();
    }

    /**
     * Regenerates the sequence with a new number of samples.
     * @param numSamples Number of samples in the sequence.
     */
    public regenerate(numSamples: number) {
        this._generateSequence(numSamples);
        this.next();
    }

    /**
     * Sets the dimensions of the sequence.
     * @param width Factor to scale the x coordinate by. The scaling factor is 1/width.
     * @param height Factor to scale the y coordinate by. The scaling factor is 1/height.
     */
    public setDimensions(width: number, height: number) {
        this._width = width;
        this._height = height;
    }

    /**
     * Advances to the next sample in the sequence.
     */
    public next() {
        (this.x as number) = this._sequence[this._curIndex] / this._width;
        (this.y as number) = this._sequence[this._curIndex + 1] / this._height;

        this._curIndex += 2;

        if (this._curIndex >= this._numSamples * 2) {
            this._curIndex = 0;
        }
    }

    private _generateSequence(numSamples: number) {
        this._sequence = [];
        this._curIndex = 0;
        this._numSamples = numSamples;

        for (let i = 1; i <= numSamples; ++i) {
            this._sequence.push(this._halton(i, this._baseX) - 0.5, this._halton(i, this._baseY) - 0.5);
        }
    }

    private _halton(index: number, base: number) {
        let fraction = 1;
        let result = 0;
        while (index > 0) {
            fraction /= base;
            result += fraction * (index % base);
            index = ~~(index / base); // floor division
        }
        return result;
    }
}
