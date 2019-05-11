
/** @hidden */
export class ShaderCodeNode {
    line: string;
    next: ShaderCodeNode;
    parent?: ShaderCodeNode;

    getNextNode(preprocessors: {[key: string]: string}) {
        return this.next;
    }
}