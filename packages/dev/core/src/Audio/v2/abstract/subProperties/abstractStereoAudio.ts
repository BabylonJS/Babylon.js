/** */
export abstract class AbstractStereoAudio {
    /**
     * The stereo pan from -1 (left) to 1 (right). Default is 0.
     */
    public abstract get pan(): number;
    public abstract set pan(value: number);
}
