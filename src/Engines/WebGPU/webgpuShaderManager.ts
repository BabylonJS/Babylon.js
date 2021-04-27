import { Effect } from "../../Materials/effect";
import { IWebGPURenderPipelineStageDescriptor } from "./webgpuPipelineContext";

/** @hidden */
export class WebGPUShaderManager {

    private _shaders: { [name: string]: IWebGPURenderPipelineStageDescriptor } = {};
    private _device: GPUDevice;

    constructor(device: GPUDevice) {
        this._device = device;
    }

    public getRenderCompiledShaders(name: string): IWebGPURenderPipelineStageDescriptor {
        let shaders = this._shaders[name];
        if (!shaders) {
            shaders = this._shaders[name] = {
                vertexStage: {
                    module: this._device.createShaderModule({
                        code: Effect.ShadersStore[name + "VertexShader"]
                    }),
                    entryPoint: 'main'
                },
                fragmentStage: {
                    module: this._device.createShaderModule({
                        code: Effect.ShadersStore[name + "PixelShader"]
                    }),
                    entryPoint: 'main'
                }
            };
        }
        return shaders;
    }

    public getComputeCompiledShader(name: string): IWebGPURenderPipelineStageDescriptor {
        let shaders = this._shaders[name];
        if (!shaders) {
            shaders = this._shaders[name] = {
                vertexStage: {
                    module: this._device.createShaderModule({
                        code: Effect.ShadersStore[name + "ComputeShader"]
                    }),
                    entryPoint: 'main'
                },
            };
        }
        return shaders;
    }
}
