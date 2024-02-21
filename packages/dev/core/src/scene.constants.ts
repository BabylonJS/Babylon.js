/**
 * Class used to store scene constants
 */
export class SceneConstants {
        /** The fog is deactivated */
        public static readonly FOGMODE_NONE = 0;
        /** The fog density is following an exponential function */
        public static readonly FOGMODE_EXP = 1;
        /** The fog density is following an exponential function faster than FOGMODE_EXP */
        public static readonly FOGMODE_EXP2 = 2;
        /** The fog density is following a linear function. */
        public static readonly FOGMODE_LINEAR = 3;
}