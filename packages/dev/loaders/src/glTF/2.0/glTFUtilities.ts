import { AccessorType } from "babylonjs-gltf2interface";

/**
 * @hidden
 */
export class _GLTFUtilities {
    /**
     * Used internally to determine how much data to be gather from input buffer at each key frame.
     * @param accessorType the accessor type
     * @returns the number of item to be gather at each keyframe
     */
    public static _GetDataAccessorElementCount(accessorType: AccessorType) {
        switch (accessorType) {
            case AccessorType.SCALAR:
                return 1;
            case AccessorType.VEC2:
                return 2;
            case AccessorType.VEC3:
                return 3;
            case AccessorType.VEC4:
            case AccessorType.MAT2:
                return 4;
            case AccessorType.MAT3:
                return 9;
            case AccessorType.MAT4:
                return 16;
        }
    }
}
