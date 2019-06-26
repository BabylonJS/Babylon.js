import { WebGL2ShaderProcessor } from "../WebGL/webGL2ShaderProcessors";
import { VertexBuffer } from "../../Meshes/buffer";

// These numbers must match the values for bgfx::Attrib::Enum
const attributeLocations: { [kind: string]: number } = {
    [VertexBuffer.PositionKind]: 0,
    [VertexBuffer.NormalKind]: 1,
    [VertexBuffer.TangentKind]: 2,
    [VertexBuffer.ColorKind]: 4,
    [VertexBuffer.MatricesIndicesKind]: 8,
    [VertexBuffer.MatricesWeightsKind]: 9,
};

// Must match bgfx::Attrib::TexCoord0
const firstGenericAttributeLocation = 10;

// Must match bgfx::Attrib::TexCoord7
const lastGenericAttributeLocation = 17;

/** @hidden */
export class NativeShaderProcessor extends WebGL2ShaderProcessor {
    private _genericAttributeLocation: number;
    private _varyingLocationCount: number;
    private _varyingLocationMap: { [name: string]: number };
    private _replacements: Array<{ searchValue: RegExp, replaceValue: string }>;
    private _textureCount: number;
    private _uniforms: Array<string>;

    public linePreProcessor(line: string): string {
        for (const replacement of this._replacements) {
            line = line.replace(replacement.searchValue, replacement.replaceValue);
        }

        return line;
    }

    public attributeProcessor(attribute: string): string {
        const match = attribute.match(/attribute\s+[^\s]+\s+([^\s]+)\s*(?:\[.+\])?\s*;/)!;
        const name = match[1];

        let location = attributeLocations[name];
        if (location === undefined) {
            location = this._genericAttributeLocation++;
            if (location > lastGenericAttributeLocation) {
                throw new Error("Exceeded maximum custom attributes");
            }
        }

        return `layout(location=${location}) ${super.attributeProcessor(attribute)}`;
    }

    public varyingProcessor(varying: string, isFragment: boolean): string {
        let location: number;

        if (isFragment) {
            location = this._varyingLocationMap[varying];
        }
        else {
            location = this._varyingLocationCount++;
            this._varyingLocationMap[varying] = location;
        }

        return `layout(location=${location}) ${super.varyingProcessor(varying, isFragment)}`;
    }

    public uniformProcessor(uniform: string): string {
        const match = uniform.match(/uniform\s+([^\s]+)\s+([^\s]+)\s*(?:\[.+\])?\s*;/)!;
        const type = match[1];
        const name = match[2];

        switch (type) {
            case "sampler2D":
            case "samplerCube": {
                const suffix = type.substr(7);
                const binding = this._textureCount++;
                this._replacements.push({ searchValue: new RegExp(`\\b${name}\\b`), replaceValue: `sampler${suffix}(${name}Texture, ${name})` });
                return `layout(binding=${binding}) uniform texture${suffix} ${name}Texture;\nlayout(binding=${binding}) uniform sampler ${name};`;
            }
        }

        this._uniforms.push(uniform);
        return this._uniforms.length === 1 ? "<UNIFORM>" : "";
    }

    public preProcessor(code: string, defines: string[], isFragment: boolean): string {
        this._genericAttributeLocation = firstGenericAttributeLocation;

        if (!isFragment) {
            this._varyingLocationCount = 0;
            this._varyingLocationMap = {};
        }

        this._replacements = [];
        this._textureCount = 0;
        this._uniforms = [];
        return code;
    }

   public postProcessor(code: string, defines: string[], isFragment: boolean): string {
        code = super.postProcessor(code, defines, isFragment);
        code = code.replace("<UNIFORM>", `uniform Frame {\n${this._uniforms.join("\n")}\n};`);
        code = code.replace("out vec4 glFragColor", "layout(location=0) out vec4 glFragColor");
        return code;
    }
}