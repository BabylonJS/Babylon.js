import type { Nullable, EffectWrapperCreationOptions, AbstractEngine } from "core/index";
import { EffectWrapper } from "core/Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * PassPostProcess which produces an output the same as it's input
 */
export class ThinPassPostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "pass";

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/pass.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/pass.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * Constructs a new pass post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        const localOptions: EffectWrapperCreationOptions = {
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinPassPostProcess.FragmentUrl,
            ...options,
        };

        if (!localOptions.engine) {
            localOptions.engine = Engine.LastCreatedEngine!;
        }

        super(localOptions);
    }
}

/**
 * PassCubePostProcess which produces an output the same as it's input (which must be a cube texture)
 */
export class ThinPassCubePostProcess extends EffectWrapper {
    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "passCube";

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/passCube.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/passCube.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * Creates the PassCubePostProcess
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinPassCubePostProcess.FragmentUrl,
            defines: "#define POSITIVEX",
        });
    }

    private _face = 0;

    /**
     * Gets or sets the cube face to display.
     *  * 0 is +X
     *  * 1 is -X
     *  * 2 is +Y
     *  * 3 is -Y
     *  * 4 is +Z
     *  * 5 is -Z
     */
    public get face(): number {
        return this._face;
    }

    public set face(value: number) {
        if (value < 0 || value > 5) {
            return;
        }

        this._face = value;
        switch (this._face) {
            case 0:
                this.updateEffect("#define POSITIVEX");
                break;
            case 1:
                this.updateEffect("#define NEGATIVEX");
                break;
            case 2:
                this.updateEffect("#define POSITIVEY");
                break;
            case 3:
                this.updateEffect("#define NEGATIVEY");
                break;
            case 4:
                this.updateEffect("#define POSITIVEZ");
                break;
            case 5:
                this.updateEffect("#define NEGATIVEZ");
                break;
        }
    }
}
