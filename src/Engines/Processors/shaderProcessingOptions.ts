import { IShaderProcessor } from './iShaderProcessor';

/** @hidden */
export interface ProcessingOptions {
    defines: string;
    indexParameters: any;
    isFragment: boolean;
    shouldUseHighPrecisionShader: boolean;
    supportsUniformBuffers: boolean;
    shadersRepository: string;
    includesShadersStore: { [key: string]: string };
    processor?: IShaderProcessor;
}