import { IPipelineContext } from '../IPipelineContext';
import { Nullable } from '../../types';
import { ThinEngine } from '../thinEngine';

/** @hidden */
export class WebGLPipelineContext implements IPipelineContext {
    public engine: ThinEngine;
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

    public _handlesSpectorRebuildCallback(onCompiled: (program: WebGLProgram) => void): void {
        if (onCompiled && this.program) {
            onCompiled(this.program);
        }
    }
}