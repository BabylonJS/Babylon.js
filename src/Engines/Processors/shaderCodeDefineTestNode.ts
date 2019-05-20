import { ShaderCodeNode } from './shaderCodeNode';

/** @hidden */
export class ShaderCodeDefineTestNode extends ShaderCodeNode {
    define: string;

    isValid(preprocessors: { [key: string]: string }) {
        return preprocessors[this.define] !== undefined;
    }
}