import { getMaterialFamily, getMaterialSource, getTextureMetadata, isMaterialView, type NodeInputHandle, type NodeMaterial, type Texture2D } from "@babylonjs/lite";
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

function ReadName(target: object): string | undefined {
    try {
        const name = (target as { name?: unknown }).name;
        return name === undefined ? "" : typeof name === "string" ? name : undefined;
    } catch {
        return undefined;
    }
}

const NodeGeneral: FunctionComponent<MaterialAdapterProps> = (props) => {
    const { material, resourceIndexService, selectionService } = props;
    const { source, record, operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const name = useWatchedValue(material, ReadName);
    if (!record) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }
    const family = getMaterialFamily(source);
    const displayName = name || `${family ? `${family[0].toUpperCase()}${family.slice(1)}` : "Node"} Material`;
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
            <TextPropertyLine label="Family" value={family ?? "node"} />
            <TextPropertyLine label="Selection" value={isMaterialView(material) ? "MaterialView" : "Material"} />
            {isMaterialView(material) ? <TextPropertyLine label="Source" value={displayName} /> : undefined}
        </>
    );
};

type ValueInputType = Exclude<NodeInputHandle["type"], "texture2d">;

function ValueLength(type: ValueInputType): 1 | 2 | 3 | 4 {
    switch (type) {
        case "f32":
            return 1;
        case "vec2f":
            return 2;
        case "vec3f":
            return 3;
        case "vec4f":
            return 4;
    }
}

function FieldType(type: ValueInputType): DynamicFieldType {
    switch (type) {
        case "f32":
            return "number";
        case "vec2f":
            return "vec2";
        case "vec3f":
            return "vec3";
        case "vec4f":
            return "vec4";
    }
}

const NodeValueField: FunctionComponent<MaterialAdapterProps & { name: string; type: ValueInputType }> = (props) => {
    const { material, name, type, resourceIndexService, selectionService } = props;
    const node = getMaterialSource(material) as NodeMaterial;
    const { operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const id = `node.input:${name}`;
    const read = useCallback((): DynamicFieldValue | undefined => {
        const input = node.inputs[name];
        if (!input || input.type !== type) {
            return undefined;
        }
        const value = input.value;
        if (type === "f32") {
            return typeof value === "number" ? value : undefined;
        }
        return Array.isArray(value) && value.length === ValueLength(type) ? [...value] : undefined;
    }, [node, name, type]);
    const write = (value: DynamicFieldValue) => {
        let oldValue: DynamicFieldValue | undefined;
        try {
            oldValue = read();
        } catch {
            // A stale or unreadable input is reported by the guarded apply below.
        }
        const newValue = typeof value === "number" ? value : [...value];
        commit({
            id,
            oldValue,
            newValue,
            invalidate: "owned",
            apply: () => {
                const input = node.inputs[name];
                if (!input || input.type !== type) {
                    throw new Error(`Property "${id}" is stale or unsupported for a Node material.`);
                }
                input.value = ValidateDynamicValue(id, newValue, ValueLength(type));
            },
        });
    };
    return (
        <DynamicMaterialField
            target={node}
            id={id}
            label={name}
            type={FieldType(type)}
            read={read}
            write={write}
            unavailable={`Node input "${name}" has no readable ${type} value.`}
            pending={operations[id]?.pending}
            error={operations[id]?.error}
        />
    );
};

const NodeTextureField: FunctionComponent<MaterialAdapterProps & { name: string }> = (props) => {
    const { material, name, resourceIndexService, selectionService } = props;
    const { source, record, operations, commit } = useDirectMaterialOperations(material, resourceIndexService, selectionService);
    const node = source as NodeMaterial;
    const id = `node.texture:${name}`;
    let texture: Texture2D | null | undefined;
    try {
        const input = node.inputs[name];
        if (!input || input.type !== "texture2d") {
            throw new Error("The input is no longer a texture.");
        }
        texture = input.texture;
    } catch {
        return <TextPropertyLine label={name} value={`Unavailable: Node texture input "${name}" is unreadable.`} />;
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
            acceptedKinds={["2d"]}
            invalidate="rebuild"
            apply={(nextTexture) => {
                const input = node.inputs[name];
                if (!input || input.type !== "texture2d") {
                    throw new Error(`Texture binding "${id}" is stale or unsupported for a Node material.`);
                }
                if (nextTexture) {
                    const metadata = getTextureMetadata(nextTexture);
                    if (metadata?.kind !== "2d" || metadata.sampleType === "depth" || metadata.sampleType === "sint" || metadata.sampleType === "uint") {
                        throw new TypeError(`Texture binding "${id}" requires a float-sampled Texture2D value.`);
                    }
                }
                input.texture = nextTexture as Texture2D | null;
            }}
        />
    );
};

/**
 * Displays sorted Node value inputs and texture bindings directly.
 * @param props The selected material section and instance services.
 * @returns Node material property content.
 */
export const NodeMaterialAdapter: FunctionComponent<MaterialAdapterProps> = (props) => {
    const { material, section, resourceIndexService } = props;
    const node = getMaterialSource(material) as NodeMaterial;
    const getNames = useCallback(() => Object.keys(node.inputs).sort(), [node]);
    const names = useObservableState(getNames, resourceIndexService.onChanged);
    if (section === "general") {
        return <NodeGeneral {...props} />;
    }
    if (section === "inputs") {
        if (!resourceIndexService.index.getMaterialRecord(getMaterialSource(material))) {
            return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
        }
        return (
            <>
                {names.map((name) => {
                    const type = node.inputs[name]?.type;
                    return type === "texture2d" ? (
                        <NodeTextureField key={name} {...props} name={name} />
                    ) : type ? (
                        <NodeValueField key={name} {...props} name={name} type={type} />
                    ) : undefined;
                })}
            </>
        );
    }
    return null;
};
