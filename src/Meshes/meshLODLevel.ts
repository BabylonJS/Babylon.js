import { Mesh } from './mesh';
import { Nullable } from '../types';

/**
 * Class used to represent a specific level of detail of a mesh
 * @see https://doc.babylonjs.com/how_to/how_to_use_lod
 */
export class MeshLODLevel {
    /**
     * Creates a new LOD level
     * @param distanceOrScreenCoverage defines either the distance or the screen coverage where this level should start being displayed
     * @param mesh defines the mesh to use to render this level
     * @param screenCoverage if specified, will use screen coverage (surface on the screen) to select LOD level
     */
    constructor(
        /** Either distance from the center of the object to show this level or the screen coverage if `useScreenCoverage` is set to `true` */
        public distanceOrScreenCoverage: number,
        /** Defines the mesh to use to render this level */
        public mesh: Nullable<Mesh>,
        /** Alternative definition of LOD level, using screen coverage instead of distance */
        public useScreenCoverage: boolean = false) {
    }
}
