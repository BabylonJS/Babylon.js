type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * Mixin to add UV defines to your material defines
 * @internal
 */
export function UVDefinesMixin<Tbase extends Constructor>(base: Tbase) {
    return class extends base {
        public MAINUV1 = false;
        public MAINUV2 = false;
        public MAINUV3 = false;
        public MAINUV4 = false;
        public MAINUV5 = false;
        public MAINUV6 = false;
        public UV1 = false;
        public UV2 = false;
        public UV3 = false;
        public UV4 = false;
        public UV5 = false;
        public UV6 = false;
    };
}
