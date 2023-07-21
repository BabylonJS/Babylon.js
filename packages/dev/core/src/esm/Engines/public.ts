import { IEngineInitOptions, IEnginePublic, EngineType } from "./engine.state";

export { IEngineInitOptions, IEnginePublic as IEngineState, EngineType };

export function initEngine(options: IEngineInitOptions): IEnginePublic {
    return initEngine(options);
}