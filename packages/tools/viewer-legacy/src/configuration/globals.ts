import { Engine } from "core/Engines/engine";

export class ViewerGlobals {
    public disableInit: boolean = false;
    public disableWebGL2Support: boolean = false;

    public get version(): string {
        return Engine.Version;
    }
}

export const viewerGlobals: ViewerGlobals = new ViewerGlobals();
