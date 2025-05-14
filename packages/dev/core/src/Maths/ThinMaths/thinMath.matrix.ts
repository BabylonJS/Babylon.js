import type { Tuple } from "core/types";
import type { IMatrixLike } from "../math.like";

/**
 * A thin matrix class that is used for size reasons.
 * The class is identity by default
 */
export class ThinMatrix implements IMatrixLike {
    private readonly _m: Tuple<number, 16> = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0];

    /**
     * Returns the matrix as a Array<number>
     * @returns the matrix underlying array.
     */
    public asArray(): Tuple<number, 16> {
        return this._m;
    }

    /**
     * Gets the update flag of the matrix which is an unique number for the matrix.
     * It will be incremented every time the matrix data change.
     * You can use it to speed the comparison between two versions of the same matrix.
     */
    public updateFlag: number = 0;
}
