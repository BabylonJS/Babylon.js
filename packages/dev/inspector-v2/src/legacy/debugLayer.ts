import type { IInspectorOptions } from "core/index";

import { DebugLayer } from "core/Debug/debugLayer";
import { Lazy } from "core/Misc/lazy";
import { Scene } from "core/scene";

const LazyInspectorModule = new Lazy(async () => await import("./inspector"));

Object.defineProperty(Scene.prototype, "debugLayer", {
    get: function (this: Scene) {
        if (!this._debugLayer) {
            this._debugLayer = new DebugLayerEx(this);
        }
        return this._debugLayer;
    },
    enumerable: true,
    configurable: true,
});

class DebugLayerEx extends DebugLayer {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    override async show(config?: IInspectorOptions): Promise<DebugLayer> {
        // If a custom inspector URL is not provided, default to a lazy dynamic import of the inspector module.
        if (!config?.inspectorURL) {
            this.BJSINSPECTOR = await LazyInspectorModule.value;
        }
        return await super.show(config);
    }
}
