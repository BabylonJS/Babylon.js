export {};

declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Gets the names of the render passes that are currently created
         * @returns list of the render pass names
         */
        getRenderPassNames(): string[];

        /**
         * Gets the name of the current render pass
         * @returns name of the current render pass
         */
        getCurrentRenderPassName(): string;

        /**
         * Creates a render pass id
         * @param name Name of the render pass (for debug purpose only)
         * @returns the id of the new render pass
         */
        createRenderPassId(name?: string): number;

        /**
         * Releases a render pass id
         * @param id id of the render pass to release
         */
        releaseRenderPassId(id: number): void;
    }
}
