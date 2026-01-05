import type { Nullable, AbstractEngine, EffectWrapperCreationOptions, Effect } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";
import { Observable } from "../Misc/observable";

/**
 * Class used to apply a custom post process
 */
export class ThinCustomPostProcess extends EffectWrapper {
    /**
     * Observable triggered when the post process is bound
     */
    public onBindObservable: Observable<Effect> = new Observable<Effect>();

    /**
     * Constructs a new custom post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, options?: EffectWrapperCreationOptions) {
        super({
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            ...options,
        });
    }

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        this.onBindObservable.notifyObservers(this._drawWrapper.effect!);
    }
}
