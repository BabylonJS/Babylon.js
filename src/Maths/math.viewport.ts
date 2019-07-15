
/**
 * Class used to represent a viewport on screen
 */
export class Viewport {
    /**
     * Creates a Viewport object located at (x, y) and sized (width, height)
     * @param x defines viewport left coordinate
     * @param y defines viewport top coordinate
     * @param width defines the viewport width
     * @param height defines the viewport height
     */
    constructor(
        /** viewport left coordinate */
        public x: number,
        /** viewport top coordinate */
        public y: number,
        /**viewport width */
        public width: number,
        /** viewport height */
        public height: number) {
    }

    /**
     * Creates a new viewport using absolute sizing (from 0-> width, 0-> height instead of 0->1)
     * @param renderWidth defines the rendering width
     * @param renderHeight defines the rendering height
     * @returns a new Viewport
     */
    public toGlobal(renderWidth: number, renderHeight: number): Viewport {
        return new Viewport(this.x * renderWidth, this.y * renderHeight, this.width * renderWidth, this.height * renderHeight);
    }

    /**
     * Stores absolute viewport value into a target viewport (from 0-> width, 0-> height instead of 0->1)
     * @param renderWidth defines the rendering width
     * @param renderHeight defines the rendering height
     * @param ref defines the target viewport
     * @returns the current viewport
     */
    public toGlobalToRef(renderWidth: number, renderHeight: number, ref: Viewport): Viewport {
        ref.x = this.x * renderWidth;
        ref.y = this.y * renderHeight;
        ref.width = this.width * renderWidth;
        ref.height = this.height * renderHeight;
        return this;
    }

    /**
     * Returns a new Viewport copied from the current one
     * @returns a new Viewport
     */
    public clone(): Viewport {
        return new Viewport(this.x, this.y, this.width, this.height);
    }
}