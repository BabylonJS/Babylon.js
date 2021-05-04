/**
 * Class used to store gfx data (like WebGLBuffer)
 */
export class DataBuffer {
    private static _Counter = 0;

    /**
     * Gets or sets the number of objects referencing this buffer
     */
    public references: number = 0;
    /** Gets or sets the size of the underlying buffer */
    public capacity: number = 0;
    /**
     * Gets or sets a boolean indicating if the buffer contains 32bits indices
     */
    public is32Bits: boolean = false;

    /**
     * Gets the underlying buffer
     */
    public get underlyingResource(): any {
        return null;
    }

    /**
     * Gets the unique id of this buffer
     */
    public readonly uniqueId: number;

    /**
     * Constructs the buffer
     */
    constructor() {
        this.uniqueId = DataBuffer._Counter++;
    }
}