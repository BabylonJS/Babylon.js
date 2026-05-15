type PrepassDefinesMixinConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin to add prepass defines to your material defines
 * @internal
 */
export function PrepassDefinesMixin<Tbase extends PrepassDefinesMixinConstructor>(base: Tbase) {
    return class extends base {
        public PREPASS = false;
        public PREPASS_COLOR = false;
        public PREPASS_COLOR_INDEX = -1;
        public PREPASS_IRRADIANCE_LEGACY = false;
        public PREPASS_IRRADIANCE_LEGACY_INDEX = -1;
        public PREPASS_IRRADIANCE = false;
        public PREPASS_IRRADIANCE_INDEX = -1;
        public PREPASS_ALBEDO = false;
        public PREPASS_ALBEDO_INDEX = -1;
        public PREPASS_ALBEDO_SQRT = false;
        public PREPASS_ALBEDO_SQRT_INDEX = -1;
        public PREPASS_DEPTH = false;
        public PREPASS_DEPTH_INDEX = -1;
        public PREPASS_SCREENSPACE_DEPTH = false;
        public PREPASS_SCREENSPACE_DEPTH_INDEX = -1;
        public PREPASS_NORMALIZED_VIEW_DEPTH = false;
        public PREPASS_NORMALIZED_VIEW_DEPTH_INDEX = -1;
        public PREPASS_NORMAL = false;
        public PREPASS_NORMAL_INDEX = -1;
        public PREPASS_NORMAL_WORLDSPACE = false;
        public PREPASS_WORLD_NORMAL = false;
        public PREPASS_WORLD_NORMAL_INDEX = -1;
        public PREPASS_POSITION = false;
        public PREPASS_POSITION_INDEX = -1;
        public PREPASS_LOCAL_POSITION = false;
        public PREPASS_LOCAL_POSITION_INDEX = -1;
        public PREPASS_VELOCITY = false;
        public PREPASS_VELOCITY_INDEX = -1;
        public PREPASS_VELOCITY_LINEAR = false;
        public PREPASS_VELOCITY_LINEAR_INDEX = -1;
        public PREPASS_REFLECTIVITY = false;
        public PREPASS_REFLECTIVITY_INDEX = -1;
        public SCENE_MRT_COUNT = 0;
    };
}
