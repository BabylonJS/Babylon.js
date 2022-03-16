/**
 * Composed of a frame, and an action function
 */
export class AnimationEvent {
    /**
     * Specifies if the animation event is done
     */
    public isDone: boolean = false;

    /**
     * Initializes the animation event
     * @param frame The frame for which the event is triggered
     * @param action The event to perform when triggered
     * @param onlyOnce Specifies if the event should be triggered only once
     */
    constructor(
        /** The frame for which the event is triggered **/
        public frame: number,
        /** The event to perform when triggered **/
        public action: (currentFrame: number) => void,
        /** Specifies if the event should be triggered only once**/
        public onlyOnce?: boolean) {
    }

    /** @hidden */
    public _clone(): AnimationEvent {
        return new AnimationEvent(this.frame, this.action, this.onlyOnce);
    }
}
