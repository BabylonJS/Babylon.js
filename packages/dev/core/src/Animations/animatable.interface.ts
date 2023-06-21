import type { Nullable } from "../types";

import type { Animation } from "./animation";

/**
 * Interface containing an array of animations
 */
export interface IAnimatable {
    /**
     * Array of animations
     */
    animations: Nullable<Array<Animation>>;
}
