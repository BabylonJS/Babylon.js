/**
 * Represents the range of an animation
 */
export class AnimationRange {
    /**
     * Initializes the range of an animation
     * @param name The name of the animation range
     * @param from The starting frame of the animation
     * @param to The ending frame of the animation
     */
    constructor(
        /**The name of the animation range**/
        public name: string,
        /**The starting frame of the animation */
        public from: number,
        /**The ending frame of the animation*/
        public to: number) {
    }

    /**
     * Makes a copy of the animation range
     * @returns A copy of the animation range
     */
    public clone(): AnimationRange {
        return new AnimationRange(this.name, this.from, this.to);
    }
}