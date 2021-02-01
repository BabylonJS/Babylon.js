import { Vector3, Matrix } from '../Maths/math.vector';
import { AbstractMesh } from '../Meshes/abstractMesh';

/**
 * Class containing a set of static utilities functions for managing Pivots
 * @hidden
 */
export class PivotTools {
    // Stores the state of the pivot cache (_oldPivotPoint, _pivotTranslation)
    // store/remove pivot point should only be applied during their outermost calls
    private static _PivotCached = 0;
    private static _OldPivotPoint = new Vector3();
    private static _PivotTranslation = new Vector3();
    private static _PivotTmpVector = new Vector3();
    private static _PivotPostMultiplyPivotMatrix = false;
    /** @hidden */
    public static _RemoveAndStorePivotPoint(mesh: AbstractMesh) {
        if (mesh && PivotTools._PivotCached === 0) {
            // Save old pivot and set pivot to 0,0,0
            mesh.getPivotPointToRef(PivotTools._OldPivotPoint);
            PivotTools._PivotPostMultiplyPivotMatrix = mesh._postMultiplyPivotMatrix;
            if (!PivotTools._OldPivotPoint.equalsToFloats(0, 0, 0)) {
                mesh.setPivotMatrix(Matrix.IdentityReadOnly);
                PivotTools._OldPivotPoint.subtractToRef(mesh.getPivotPoint(), PivotTools._PivotTranslation);
                PivotTools._PivotTmpVector.copyFromFloats(1, 1, 1);
                PivotTools._PivotTmpVector.subtractInPlace(mesh.scaling);
                PivotTools._PivotTmpVector.multiplyInPlace(PivotTools._PivotTranslation);
                mesh.position.addInPlace(PivotTools._PivotTmpVector);
            }
        }
        PivotTools._PivotCached++;
    }
    /** @hidden */
    public static _RestorePivotPoint(mesh: AbstractMesh) {
        if (mesh && !PivotTools._OldPivotPoint.equalsToFloats(0, 0, 0) && PivotTools._PivotCached === 1) {
            mesh.setPivotPoint(PivotTools._OldPivotPoint);
            mesh._postMultiplyPivotMatrix = PivotTools._PivotPostMultiplyPivotMatrix;
            PivotTools._PivotTmpVector.copyFromFloats(1, 1, 1);
            PivotTools._PivotTmpVector.subtractInPlace(mesh.scaling);
            PivotTools._PivotTmpVector.multiplyInPlace(PivotTools._PivotTranslation);
            mesh.position.subtractInPlace(PivotTools._PivotTmpVector);
        }
        this._PivotCached--;
    }
}