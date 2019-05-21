import { IShaderProcessor } from '../Processors/iShaderProcessor';

/** @hidden */
export class WebGL2ShaderProcessor implements IShaderProcessor {
    public attributeProcessor(attribute: string) {
        return attribute.replace("attribute", "in");
    }
}