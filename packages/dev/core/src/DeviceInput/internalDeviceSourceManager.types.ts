import { type InternalDeviceSourceManager } from "./internalDeviceSourceManager.pure";
declare module "../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface AbstractEngine {
        /** @internal */
        _deviceSourceManager?: InternalDeviceSourceManager;
    }
}
