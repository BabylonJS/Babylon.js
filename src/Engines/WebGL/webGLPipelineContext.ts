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

    public vertexCompilationError: Nullable<string> = null;
    public fragmentCompilationError: Nullable<string> = null;
    public programLinkError: Nullable<string> = null;
    public programValidationError: Nullable<string> = null;

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

    public _getVertexShaderCode(): string | null {
        return this.vertexShader ? this.engine._getShaderSource(this.vertexShader) : null;
    }

    public _getFragmentShaderCode(): string | null {
        return this.fragmentShader ? this.engine._getShaderSource(this.fragmentShader) : null;
    }
}