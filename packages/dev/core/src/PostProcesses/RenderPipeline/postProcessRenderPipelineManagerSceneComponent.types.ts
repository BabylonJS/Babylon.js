import { type PostProcessRenderPipelineManager } from "./postProcessRenderPipelineManager";
declare module "../../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _postProcessRenderPipelineManager: PostProcessRenderPipelineManager;

        /**
         * Gets the postprocess render pipeline manager
         * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/postProcessRenderPipeline
         * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/defaultRenderingPipeline
         */
        readonly postProcessRenderPipelineManager: PostProcessRenderPipelineManager;
    }
}
