type EnvironmentLightingDefinesMixinConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin to add UV defines to your material defines
 * @internal
 */
export function EnvironmentLightingDefinesMixin<Tbase extends EnvironmentLightingDefinesMixinConstructor>(base: Tbase) {
    return class extends base {
        public REFLECTION = false;
        public REFLECTIONMAP_3D = false;
        public REFLECTIONMAP_SPHERICAL = false;
        public REFLECTIONMAP_PLANAR = false;
        public REFLECTIONMAP_CUBIC = false;
        public USE_LOCAL_REFLECTIONMAP_CUBIC = false;
        public REFLECTIONMAP_PROJECTION = false;
        public REFLECTIONMAP_SKYBOX = false;
        public REFLECTIONMAP_EXPLICIT = false;
        public REFLECTIONMAP_EQUIRECTANGULAR = false;
        public REFLECTIONMAP_EQUIRECTANGULAR_FIXED = false;
        public REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED = false;
        public INVERTCUBICMAP = false;
        public USESPHERICALFROMREFLECTIONMAP = false;
        public USEIRRADIANCEMAP = false;
        public USE_IRRADIANCE_DOMINANT_DIRECTION = false;
        public USESPHERICALINVERTEX = false;
        public REFLECTIONMAP_OPPOSITEZ = false;
        public LODINREFLECTIONALPHA = false;
        public GAMMAREFLECTION = false;
        public RGBDREFLECTION = false;
    };
}
