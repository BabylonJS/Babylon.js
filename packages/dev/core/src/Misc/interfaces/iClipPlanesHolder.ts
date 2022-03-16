import { Nullable } from '../../types';
import { Plane } from '../../Maths/math';

/**
 * Interface used to define entities containing multiple clip planes
 */
export interface IClipPlanesHolder {
    /**
     * Gets or sets the active clipplane 1
     */
    clipPlane: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 2
     */
    clipPlane2: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 3
     */
    clipPlane3: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 4
     */
    clipPlane4: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 5
     */
    clipPlane5: Nullable<Plane>;

    /**
     * Gets or sets the active clipplane 6
     */
    clipPlane6: Nullable<Plane>;
}