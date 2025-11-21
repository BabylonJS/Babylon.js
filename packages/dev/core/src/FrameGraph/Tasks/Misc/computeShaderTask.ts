import type {
    BaseTexture,
    DataBuffer,
    ExternalTexture,
    FrameGraph,
    FrameGraphContext,
    FrameGraphPass,
    IComputeShaderOptions,
    IComputeShaderPath,
    InternalTexture,
    StorageBuffer,
    TextureSampler,
    VideoTexture,
} from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";
import { ComputeShader } from "core/Compute/computeShader";
import { Vector3 } from "core/Maths/math.vector";
import { UniformBuffer } from "core/Materials/uniformBuffer";
import { Logger } from "core/Misc/logger";

/**
 * Task used to execute a compute shader (WebGPU only)
 */
export class FrameGraphComputeShaderTask extends FrameGraphTask {
    private readonly _notSupported: boolean;
    private readonly _cs: ComputeShader;
    private readonly _ubo: { [name: string]: { ubo: UniformBuffer; autoUpdate: boolean } };

    /**
     * Defines the dispatch size for the compute shader
     */
    public dispatchSize = new Vector3(1, 1, 1);

    /**
     * Defines an indirect dispatch buffer and offset.
     * If set, this will be used instead of the dispatchSize property and an indirect dispatch will be performed.
     * "offset" is the offset in the buffer where the workgroup counts are stored (default: 0)
     */
    public indirectDispatch?: { buffer: StorageBuffer | DataBuffer; offset?: number };

    /**
     * An optional execute function that will be called at the beginning of the task execution
     */
    public execute?: (context: FrameGraphContext) => void;

    /**
     * Gets the compute shader used by the task
     */
    public get computeShader(): ComputeShader {
        return this._cs;
    }

    /**
     * Gets a uniform buffer created by a call to createUniformBuffer()
     * @param name Name of the uniform buffer
     * @returns The uniform buffer
     */
    public getUniformBuffer(name: string): UniformBuffer {
        return this._ubo[name]?.ubo;
    }

    /**
     * Creates a new compute shader task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     * @param shaderPath Defines the route to the shader code in one of three ways:
     *  * object: \{ compute: "custom" \}, used with ShaderStore.ShadersStoreWGSL["customComputeShader"]
     *  * object: \{ computeElement: "HTMLElementId" \}, used with shader code in script tags
     *  * object: \{ computeSource: "compute shader code string" \}, where the string contains the shader code
     *  * string: try first to find the code in ShaderStore.ShadersStoreWGSL[shaderPath + "ComputeShader"]. If not, assumes it is a file with name shaderPath.compute.fx in index.html folder.
     * @param options Define the options used to create the shader
     */
    constructor(name: string, frameGraph: FrameGraph, shaderPath: IComputeShaderPath | string, options: Partial<IComputeShaderOptions> = {}) {
        super(name, frameGraph);

        if (!frameGraph.engine.getCaps().supportComputeShaders) {
            this._notSupported = true;
            Logger.Error("This engine does not support compute shaders!");
            return;
        }

        this._notSupported = false;
        this._cs = new ComputeShader(name + "_cs", frameGraph.engine, shaderPath, options);
        this._ubo = {};
    }

    public override isReady(): boolean {
        return this._notSupported ? true : this._cs.isReady();
    }

    /**
     * Creates a uniform buffer and binds it to the shader
     * @param name Name of the uniform buffer
     * @param description Description of the uniform buffer: names and sizes (in floats) of the uniforms
     * @param autoUpdate If the UBO must be updated automatically before each dispatch (default: true)
     * @returns The created uniform buffer
     */
    public createUniformBuffer(name: string, description: { [name: string]: number }, autoUpdate = true): UniformBuffer {
        const uBuffer = new UniformBuffer(this._frameGraph.engine);

        this._ubo[name] = { ubo: uBuffer, autoUpdate };

        for (const key in description) {
            uBuffer.addUniform(key, description[key]);
        }

        this._cs.setUniformBuffer(name, uBuffer);

        return uBuffer;
    }

    /**
     * Binds a texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     * @param bindSampler Bind the sampler corresponding to the texture (default: true). The sampler will be bound just before the binding index of the texture
     */
    public setTexture(name: string, texture: BaseTexture, bindSampler = true): void {
        this._cs.setTexture(name, texture, bindSampler);
    }

    /**
     * Binds an internal texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     */
    public setInternalTexture(name: string, texture: InternalTexture): void {
        this._cs.setInternalTexture(name, texture);
    }

    /**
     * Binds a storage texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     */
    public setStorageTexture(name: string, texture: BaseTexture): void {
        this._cs.setStorageTexture(name, texture);
    }

    /**
     * Binds an external texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     */
    public setExternalTexture(name: string, texture: ExternalTexture): void {
        this._cs.setExternalTexture(name, texture);
    }

    /**
     * Binds a video texture to the shader (by binding the external texture attached to this video)
     * @param name Binding name of the texture
     * @param texture Texture to bind
     * @returns true if the video texture was successfully bound, else false. false will be returned if the current engine does not support external textures
     */
    public setVideoTexture(name: string, texture: VideoTexture) {
        return this._cs.setVideoTexture(name, texture);
    }

    /**
     * Binds a uniform buffer to the shader
     * @param name Binding name of the buffer
     * @param buffer Buffer to bind
     */
    public setUniformBuffer(name: string, buffer: UniformBuffer | DataBuffer): void {
        this._cs.setUniformBuffer(name, buffer);
    }

    /**
     * Binds a storage buffer to the shader
     * @param name Binding name of the buffer
     * @param buffer Buffer to bind
     */
    public setStorageBuffer(name: string, buffer: StorageBuffer | DataBuffer): void {
        this._cs.setStorageBuffer(name, buffer);
    }

    /**
     * Binds a texture sampler to the shader
     * @param name Binding name of the sampler
     * @param sampler Sampler to bind
     */
    public setTextureSampler(name: string, sampler: TextureSampler): void {
        this._cs.setTextureSampler(name, sampler);
    }

    public record(skipCreationOfDisabledPasses?: boolean): FrameGraphPass<FrameGraphContext> {
        const pass = this._frameGraph.addPass(this.name);

        if (this._notSupported) {
            pass.setExecuteFunc(() => {});
        } else {
            pass.setExecuteFunc((context) => {
                this.execute?.(context);

                for (const key in this._ubo) {
                    const uboEntry = this._ubo[key];
                    if (uboEntry.autoUpdate) {
                        uboEntry.ubo.update();
                    }
                }

                if (this.indirectDispatch) {
                    context.pushDebugGroup(`Indirect dispatch compute shader (${this.name})`);
                    this._cs.dispatchIndirect(this.indirectDispatch.buffer, this.indirectDispatch.offset);
                    context.popDebugGroup();
                } else {
                    context.pushDebugGroup(`Dispatch compute shader (${this.name})`);
                    this._cs.dispatch(this.dispatchSize.x, this.dispatchSize.y, this.dispatchSize.z);
                    context.popDebugGroup();
                }
            });
        }

        if (!skipCreationOfDisabledPasses) {
            const passDisabled = this._frameGraph.addPass(this.name + "_disabled", true);

            passDisabled.setExecuteFunc(() => {});
        }

        return pass;
    }

    public override dispose(): void {
        for (const key in this._ubo) {
            this._ubo[key].ubo.dispose();
        }
        super.dispose();
    }
}
