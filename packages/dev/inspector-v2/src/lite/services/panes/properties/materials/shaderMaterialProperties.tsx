import {
    getMaterialFamily,
    getMaterialSource,
    getShaderTexture,
    getShaderUniform,
    getTextureMetadata,
    setShaderTexture,
    setShaderUniform,
    isMaterialView,
    type ShaderMaterial,
    type ShaderSamplerDecl,
    type ShaderUniformDecl,
    type ShaderUniformType,
    type Texture2D,
} from "@babylonjs/lite";
import { Body1 } from "@fluentui/react-components";
import { type FunctionComponent, useCallback } from "react";

import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { ComputedProperty, DerivedProperty } from "../../../../../components/properties/boundProperty";
import { useWatchedValue } from "../../../../../contexts/watcherContext";
import { DirectTextureBinding } from "./directTextureBinding";
import { DynamicMaterialField, ValidateDynamicValue, type DynamicFieldType, type DynamicFieldValue } from "./dynamicMaterialField";
import { type MaterialAdapterProps } from "./materialAdapterTypes";
import { useDirectMaterialOperations } from "./useDirectMaterialOperations";

const SystemUniforms = new Set(["world", "view", "projection", "viewProjection", "worldView", "worldViewProjection", "cameraPosition", "screenSize", "alphaCutoff"]);

function ReadName(target: object): string | undefined {
    try {
        const name = (target as { name?: unknown }).name;
        return name === undefined ? "" : typeof name === "string" ? name : undefined;
    } catch {
        return undefined;
    }
}

const ShaderGeneral: FunctionComponent<MaterialAdapterProps> = (props) => {
    const { material, resourceIndexService, selectionService } = props;
    const { source, record, operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const name = useWatchedValue(material, ReadName);
    if (!record) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }
    const family = getMaterialFamily(source);
    const displayName = name || `${family ? `${family[0].toUpperCase()}${family.slice(1)}` : "Shader"} Material`;
    const pending = operations["material.name"]?.pending;
    const error = operations["material.name"]?.error;
    return (
        <>
            <div aria-busy={pending}>
                {name === undefined ? (
                    <ComputedProperty
                        component={TextPropertyLine}
                        target={material}
                        getValue={() => "Unavailable: Material name is not a string or cannot be read."}
                        label="Name"
                        uniqueId="material.name"
                    />
                ) : (
                    <DerivedProperty
                        component={TextInputPropertyLine}
                        target={material}
                        getValue={ReadName as () => string}
                        setValue={(target, next) =>
                            commit({
                                id: "material.name",
                                oldValue: ReadName(target),
                                newValue: next,
                                invalidate: "owned",
                                apply: () => {
                                    (target as { name?: string }).name = next;
                                },
                            })
                        }
                        label="Name"
                        uniqueId="material.name"
                        disabled={pending}
                        description={error ? `Error: ${error}` : undefined}
                    />
                )}
                {pending ? <Body1 role="status">Applying Name…</Body1> : undefined}
                {error ? <Body1 role="alert">{error}</Body1> : undefined}
            </div>
            <TextPropertyLine label="Family" value={family ?? "shader"} />
            <TextPropertyLine label="Selection" value={isMaterialView(material) ? "MaterialView" : "Material"} />
            {isMaterialView(material) ? <TextPropertyLine label="Source" value={displayName} /> : undefined}
        </>
    );
};

function FieldType(type: ShaderUniformType): DynamicFieldType {
    switch (type) {
        case "f32":
        case "u32":
        case "i32":
            return "number";
        case "vec2<f32>":
            return "vec2";
        case "vec3<f32>":
            return "vec3";
        case "vec4<f32>":
            return "vec4";
        case "mat4x4<f32>":
            return "mat4";
    }
}

function ValueLength(type: ShaderUniformType): number {
    switch (type) {
        case "f32":
        case "u32":
        case "i32":
            return 1;
        case "vec2<f32>":
            return 2;
        case "vec3<f32>":
            return 3;
        case "vec4<f32>":
            return 4;
        case "mat4x4<f32>":
            return 16;
    }
}

const ShaderUniformField: FunctionComponent<MaterialAdapterProps & { declaration: ShaderUniformDecl }> = (props) => {
    const { material, declaration, resourceIndexService, selectionService } = props;
    const shader = getMaterialSource(material) as ShaderMaterial;
    const { operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const { name, type } = declaration;
    const id = `shader.uniform:${name}`;
    const read = useCallback((): DynamicFieldValue | undefined => {
        const current = shader.uniformDecls.find((candidate) => candidate.name === name && !SystemUniforms.has(candidate.name));
        if (!current || current.type !== type) {
            return undefined;
        }
        const value = getShaderUniform(shader, name);
        return typeof value === "number" ? value : Array.from(value);
    }, [shader, name, type]);
    const write = (value: DynamicFieldValue) => {
        let oldValue: DynamicFieldValue | undefined;
        try {
            oldValue = read();
        } catch {
            // A stale or unreadable declaration is reported by the guarded apply below.
        }
        const newValue = typeof value === "number" ? value : [...value];
        commit({
            id,
            oldValue,
            newValue,
            invalidate: "owned",
            apply: () => {
                const current = shader.uniformDecls.find((candidate) => candidate.name === name && !SystemUniforms.has(candidate.name));
                if (!current || current.type !== type) {
                    throw new Error(`Property "${id}" is stale, read-only, or unsupported for a Shader material.`);
                }
                const next = ValidateDynamicValue(
                    id,
                    newValue,
                    ValueLength(type),
                    type === "i32" || type === "u32",
                    type === "u32" ? 0 : type === "i32" ? -0x80000000 : undefined,
                    type === "u32" ? 0xffffffff : type === "i32" ? 0x7fffffff : undefined
                );
                setShaderUniform(shader, name, next);
            },
        });
    };
    return (
        <DynamicMaterialField
            target={shader}
            id={id}
            label={name}
            type={FieldType(type)}
            read={read}
            write={write}
            unavailable={`Shader uniform "${name}" has no readable ${type} value.`}
            integer={type === "u32" || type === "i32"}
            min={type === "u32" ? 0 : type === "i32" ? -0x80000000 : undefined}
            max={type === "u32" ? 0xffffffff : type === "i32" ? 0x7fffffff : undefined}
            pending={operations[id]?.pending}
            error={operations[id]?.error}
        />
    );
};

const ShaderSamplerField: FunctionComponent<MaterialAdapterProps & { declaration: ShaderSamplerDecl }> = (props) => {
    const { material, declaration, resourceIndexService, selectionService } = props;
    const { source, record, operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const shader = source as ShaderMaterial;
    const { name } = declaration;
    const id = `shader.sampler:${name}`;
    const expectedKind = declaration.viewDimension === "2d-array" ? "2d-array" : "2d";
    const expectedSample = declaration.comparison || declaration.sampleType === "depth" ? "depth" : "float";
    let texture: Texture2D | null;
    try {
        texture = getShaderTexture(shader, name);
    } catch {
        return <TextPropertyLine label={name} value={`Unavailable: Shader sampler "${name}" is unreadable.`} />;
    }
    if (!record) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }
    return (
        <DirectTextureBinding
            source={source}
            record={record}
            resourceIndexService={resourceIndexService}
            selectionService={selectionService}
            operations={operations}
            commit={commit}
            id={id}
            label={name}
            value={texture}
            acceptedKinds={[expectedKind]}
            sampleCategory={expectedSample}
            invalidate="owned"
            apply={(nextTexture) => {
                const current = shader.samplerDecls.find((candidate) => candidate.name === name);
                if (
                    !current ||
                    current.viewDimension !== declaration.viewDimension ||
                    current.sampleType !== declaration.sampleType ||
                    current.comparison !== declaration.comparison
                ) {
                    throw new Error(`Texture binding "${id}" is stale or unsupported for a Shader material.`);
                }
                if (nextTexture) {
                    const metadata = getTextureMetadata(nextTexture);
                    const sampleType = metadata?.sampleType;
                    const compatible =
                        expectedSample === "depth" ? sampleType === "depth" : sampleType === undefined || sampleType === "float" || sampleType === "unfilterable-float";
                    if (metadata?.kind !== expectedKind || !compatible) {
                        throw new TypeError(`Texture binding "${id}" requires a ${expectedSample} ${expectedKind} texture.`);
                    }
                }
                setShaderTexture(shader, name, nextTexture as Texture2D | null);
            }}
        />
    );
};

function SummarizeBlendComponent(component: GPUBlendComponent): string {
    return `${component.srcFactor ?? "one"}, ${component.dstFactor ?? "zero"}, ${component.operation ?? "add"}`;
}

function SummarizeConfiguration(material: ShaderMaterial): string {
    const attributes = material.attributes.length > 0 ? material.attributes.join(", ") : "none";
    const defines = material.defines.length > 0 ? material.defines.map((define) => `${define.name}=${String(define.value)}`).join(", ") : "none";
    const storageBuffers =
        material.storageBufferDecls.length > 0 ? material.storageBufferDecls.map((declaration) => `${declaration.name}: ${declaration.type}`).join(", ") : "none";
    const blend = material.blend
        ? `custom color(${SummarizeBlendComponent(material.blend.color)}) alpha(${SummarizeBlendComponent(material.blend.alpha)})`
        : material.needAlphaBlending
          ? material.blendMode
          : "disabled";
    return [
        `Attributes: ${attributes}`,
        `Defines: ${defines}`,
        `Blend: ${blend}`,
        `Transmissive: ${String(material.transmissive)}`,
        `Alpha testing: ${String(material.needAlphaTesting)}`,
        `Back-face culling: ${String(material.backFaceCulling)}`,
        `Depth write: ${String(material.depthWrite)}`,
        `Depth compare: ${material.depthCompare}`,
        `Depth-only fragment: ${String(material.depthOnlyFragment)}`,
        `Depth bias: ${String(material.depthBias)}`,
        `Depth bias slope scale: ${String(material.depthBiasSlopeScale)}`,
        "Topology: unavailable",
        `Storage buffers: ${storageBuffers}`,
    ].join("; ");
}

/**
 * Displays Shader material properties, sampler bindings, and configuration directly.
 * @param props The selected material section and instance services.
 * @returns Shader material property content.
 */
export const ShaderMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    const { material, section, resourceIndexService } = props;
    const shader = getMaterialSource(material) as ShaderMaterial;
    const getDeclarations = useCallback(() => shader.uniformDecls.filter((declaration) => !SystemUniforms.has(declaration.name)), [shader]);
    const declarations = useObservableState(getDeclarations, resourceIndexService.onChanged);
    const getSamplers = useCallback(() => shader.samplerDecls, [shader]);
    const samplers = useObservableState(getSamplers, resourceIndexService.onChanged);
    if (section === "general") {
        return <ShaderGeneral {...props} />;
    }
    if (section === "inputs") {
        if (!resourceIndexService.index.getMaterialRecord(getMaterialSource(material))) {
            return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
        }
        return (
            <>
                {declarations.map((declaration) => (
                    <ShaderUniformField key={declaration.name} {...props} declaration={declaration} />
                ))}
            </>
        );
    }
    if (section === "configuration") {
        if (!resourceIndexService.index.getMaterialRecord(getMaterialSource(material))) {
            return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
        }
        return <ComputedProperty component={TextPropertyLine} target={shader} getValue={SummarizeConfiguration} label="Configuration" />;
    }
    if (section === "textures") {
        if (!resourceIndexService.index.getMaterialRecord(getMaterialSource(material))) {
            return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
        }
        return (
            <>
                {samplers.map((declaration) => (
                    <ShaderSamplerField key={declaration.name} {...props} declaration={declaration} />
                ))}
            </>
        );
    }
    return null;
};
