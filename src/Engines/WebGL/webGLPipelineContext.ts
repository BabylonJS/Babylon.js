import { IPipelineContext } from '../IPipelineContext';
import { Engine } from '../engine';
import { Nullable } from '../../types';

/** @hidden */
export class WebGLPipelineContext implements IPipelineContext {
    public engine: Engine;
    public program: Nullable<WebGLProgram>;
    public context?: WebGLRenderingContext;
    public vertexShader?: WebGLShader;
    public fragmentShader?: WebGLShader;
    public isParallelCompiled: boolean;
    public onCompiled?: () => void;
    public transformFeedback?: WebGLTransformFeedback | null;

    public get isAsync() {
        return this.isParallelCompiled;
    }

    public get isReady(): boolean {
        if (this.program) {
            if (this.isParallelCompiled) {
                return this.engine._isRenderingStateCompiled(this);
            }
            return true;
        }

        return false;
    }
}