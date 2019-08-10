import { Vector3 } from '../Maths/math.vector';
import { Path2 } from '../Maths/math.path';

/**
 * A cursor which tracks a point on a path
 */
export class PathCursor {
    /**
     * Stores path cursor callbacks for when an onchange event is triggered
     */
    private _onchange = new Array<(cursor: PathCursor) => void>();

    /**
     * The value of the path cursor
     */
    value: number = 0;

    /**
     * The animation array of the path cursor
     */
    animations = new Array<Animation>();

    /**
     * Initializes the path cursor
     * @param path The path to track
     */
    constructor(private path: Path2) {
    }

    /**
     * Gets the cursor point on the path
     * @returns A point on the path cursor at the cursor location
     */
    public getPoint(): Vector3 {
        var point = this.path.getPointAtLengthPosition(this.value);
        return new Vector3(point.x, 0, point.y);
    }

    /**
     * Moves the cursor ahead by the step amount
     * @param step The amount to move the cursor forward
     * @returns This path cursor
     */
    public moveAhead(step: number = 0.002): PathCursor {
        this.move(step);

        return this;
    }

    /**
     * Moves the cursor behind by the step amount
     * @param step The amount to move the cursor back
     * @returns This path cursor
     */
    public moveBack(step: number = 0.002): PathCursor {
        this.move(-step);

        return this;
    }

    /**
     * Moves the cursor by the step amount
     * If the step amount is greater than one, an exception is thrown
     * @param step The amount to move the cursor
     * @returns This path cursor
     */
    public move(step: number): PathCursor {

        if (Math.abs(step) > 1) {
            throw "step size should be less than 1.";
        }

        this.value += step;
        this.ensureLimits();
        this.raiseOnChange();

        return this;
    }

    /**
     * Ensures that the value is limited between zero and one
     * @returns This path cursor
     */
    private ensureLimits(): PathCursor {
        while (this.value > 1) {
            this.value -= 1;
        }
        while (this.value < 0) {
            this.value += 1;
        }

        return this;
    }

    /**
     * Runs onchange callbacks on change (used by the animation engine)
     * @returns This path cursor
     */
    private raiseOnChange(): PathCursor {
        this._onchange.forEach((f) => f(this));

        return this;
    }

    /**
     * Executes a function on change
     * @param f A path cursor onchange callback
     * @returns This path cursor
     */
    public onchange(f: (cursor: PathCursor) => void): PathCursor {
        this._onchange.push(f);

        return this;
    }
}