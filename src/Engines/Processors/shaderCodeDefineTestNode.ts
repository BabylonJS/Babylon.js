import { ShaderCodeNode } from './shaderCodeNode';

/** @hidden */
export class ShaderCodeDefineTestNode extends ShaderCodeNode {
    define: string;
    child: ShaderCodeNode;

    getNextNode(preprocessors: {[key: string]: string}) {
        if (preprocessors[this.define] !== undefined) {
            return this.child;
        } else {
            return this.next;
        }
    }
}