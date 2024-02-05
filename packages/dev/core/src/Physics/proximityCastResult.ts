import { CastingResult } from "./castingResult";

/**
 * Class representing a contact point produced in a proximity cast
 */
export class ProximityCastResult extends CastingResult {
    protected _hitDistance: number = 0;

    /**
     * Gets the distance from the hit
     */
    get hitDistance(): number {
        return this._hitDistance;
    }

    /**
     * Sets the distance from the start point to the hit point
     * @param distance
     */
    public setHitDistance(distance: number) {
        this._hitDistance = distance;
    }

    /**
     * Resets all the values to default
     */
    public reset() {
        super.reset();
        this._hitDistance = 0;
    }
}
