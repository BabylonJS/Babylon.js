import { type Nullable } from "../types";
import { type PostProcess } from "./postProcess.pure";
declare module "../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets a texture to the context from a postprocess
         * @param channel defines the channel to use
         * @param postProcess defines the source postprocess
         * @param name name of the channel
         */
        setTextureFromPostProcess(channel: number, postProcess: Nullable<PostProcess>, name: string): void;

        /**
         * Binds the output of the passed in post process to the texture channel specified
         * @param channel The channel the texture should be bound to
         * @param postProcess The post process which's output should be bound
         * @param name name of the channel
         */
        setTextureFromPostProcessOutput(channel: number, postProcess: Nullable<PostProcess>, name: string): void;
    }
}
declare module "../Materials/effect.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Effect {
        /**
         * Sets a texture to be the input of the specified post process. (To use the output, pass in the next post process in the pipeline)
         * @param channel Name of the sampler variable.
         * @param postProcess Post process to get the input texture from.
         */
        setTextureFromPostProcess(channel: string, postProcess: Nullable<PostProcess>): void;

        /**
         * (Warning! setTextureFromPostProcessOutput may be desired instead)
         * Sets the input texture of the passed in post process to be input of this effect. (To use the output of the passed in post process use setTextureFromPostProcessOutput)
         * @param channel Name of the sampler variable.
         * @param postProcess Post process to get the output texture from.
         */
        setTextureFromPostProcessOutput(channel: string, postProcess: Nullable<PostProcess>): void;
    }
}
