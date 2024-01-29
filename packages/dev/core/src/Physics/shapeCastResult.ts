import { CastingResult } from "./castingResult";

/**
 * Class representing a contact point produced in a shape cast
 */
export class ShapeCastResult extends CastingResult {
    private _hitFraction: number = 0;

    /**
     * Gets the hit fraction along the casting ray
     */
    get hitFraction(): number {
        return this._hitFraction;
    }

    /**
     * Sets the hit fraction along the casting ray
     * @param fraction
     */
    public setHitFraction(fraction: number) {
        this._hitFraction = fraction;
    }
}
