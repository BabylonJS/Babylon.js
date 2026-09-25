import { type Material } from "@babylonjs/lite";
import { Body1 } from "@fluentui/react-components";
import { Fragment, type FunctionComponent, useCallback, useEffect, useState } from "react";

import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine, TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { MaterialTextureBindingPropertyLine, type MaterialTextureBindingModel } from "shared-ui-components/fluent/hoc/propertyLines/materialTextureBindingPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/colorPropertyLine";
import { Vector2PropertyLine, Vector3PropertyLine, Vector4PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { usePropertyChangedNotifier } from "../../../../../contexts/propertyContext";
import { ComputedProperty, DerivedProperty } from "../../../../../components/properties/boundProperty";
import { type ISelectionService } from "../../../../../services/selectionService";
import { type ISceneResourceIndexService } from "../../scene/sceneResourceIndexService";
import { type IMaterialResourceRecord, type ITextureResourceRecord } from "../../scene/sceneResources";
import {
    CreateMaterialDescriptorWithFamily,
    SetMaterialDescriptorPropertyWithFamily,
    SetMaterialDescriptorTextureWithFamily,
    type IMaterialDescriptorFamilyDescriptor,
} from "../descriptors/materialDescriptor";
import {
    type IMaterialDescriptor,
    type IMaterialDescriptorProperty,
    type MaterialDescriptorPropertyId,
    type MaterialDescriptorPropertyValue,
    type MaterialDescriptorTuple,
    type MaterialDescriptorSection,
    type IMaterialTextureBinding,
    type MaterialTextureMutation,
    type TextureBindingKind,
} from "../descriptors/descriptorTypes";
import { useLatestAsyncOperation } from "../useLatestAsyncOperation";

/** Props shared by each lazily loaded Lite material family adapter. */
export type MaterialAdapterProps = Readonly<{
    material: Material;
    section: MaterialDescriptorSection;
    resourceIndexService: ISceneResourceIndexService;
    selectionService: ISelectionService;
}>;

type MaterialFamilyAdapterProps = MaterialAdapterProps &
    Readonly<{
        family: "standard" | "pbr" | "shader" | "node";
        familyDescriptor: IMaterialDescriptorFamilyDescriptor;
        colorProperties?: ReadonlySet<MaterialDescriptorPropertyId>;
        getBindingSection?: (binding: IMaterialTextureBinding) => MaterialDescriptorSection;
    }>;

function FormatDescriptorValue(value: MaterialDescriptorPropertyValue): string {
    return Array.isArray(value) ? `[${value.join(", ")}]` : String(value);
}

type Matrix4Value = Extract<MaterialDescriptorTuple, { readonly length: 16 }>;

const Matrix4Field: FunctionComponent<{
    label: string;
    uniqueId: string;
    description?: string;
    disabled?: boolean;
    value: Matrix4Value;
    onChange: (value: Matrix4Value) => void;
}> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange } = props;
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);
    return (
        <PropertyLine
            label={label}
            uniqueId={uniqueId}
            description={description}
            expandedContent={
                <>
                    {draft.map((component, index) => (
                        <NumberInputPropertyLine
                            key={index}
                            label={`M${Math.floor(index / 4)}${index % 4}`}
                            value={component}
                            disabled={disabled}
                            onChange={(nextValue) => {
                                const next = [...draft] as [...Matrix4Value];
                                next[index] = nextValue;
                                setDraft(next);
                                onChange(next);
                            }}
                        />
                    ))}
                </>
            }
        >
            <Body1>[4 × 4]</Body1>
        </PropertyLine>
    );
};

type MaterialFieldProps = Readonly<{
    property: IMaterialDescriptorProperty;
    pending?: boolean;
    error?: string;
    isColor: boolean;
    commit: (property: IMaterialDescriptorProperty, value: MaterialDescriptorPropertyValue) => void;
}>;

const MaterialField: FunctionComponent<MaterialFieldProps> = (props) => {
    const { property, pending, error, isColor, commit } = props;
    const { id, label, value: datum, access } = property;
    const common = { label, uniqueId: id, disabled: pending, description: error ? `Error: ${error}` : undefined };
    let control: React.ReactNode;
    if (datum.state !== "present" || access.access !== "read-write" || property.valueType === "summary") {
        const value = datum.state === "absent" ? "Not configured" : datum.state === "unsupported" ? `Unavailable: ${datum.reason}` : FormatDescriptorValue(datum.value);
        control = (
            <ComputedProperty
                component={TextPropertyLine}
                target={property}
                getValue={() => value}
                label={label}
                uniqueId={id}
                description={access.access === "read-only" ? access.reason : undefined}
            />
        );
    } else {
        const value = datum.value;
        const setValue = (_target: IMaterialDescriptorProperty, next: MaterialDescriptorPropertyValue) => commit(property, next);
        switch (property.valueType) {
            case "boolean":
                control = <DerivedProperty component={SwitchPropertyLine} target={property} getValue={() => value as boolean} setValue={setValue} {...common} />;
                break;
            case "string":
                control = <DerivedProperty component={TextInputPropertyLine} target={property} getValue={() => value as string} setValue={setValue} {...common} />;
                break;
            case "number":
                control = (
                    <DerivedProperty
                        component={NumberInputPropertyLine}
                        target={property}
                        getValue={() => value as number}
                        setValue={setValue}
                        {...common}
                        min={access.number?.min}
                        max={access.number?.max}
                        step={access.number?.integer ? 1 : undefined}
                    />
                );
                break;
            case "enum":
                control =
                    typeof value === "number" ? (
                        <DerivedProperty
                            component={NumberDropdownPropertyLine}
                            target={property}
                            getValue={() => value}
                            setValue={setValue}
                            {...common}
                            options={(property.options ?? []).filter((option): option is { label: string; value: number } => typeof option.value === "number")}
                        />
                    ) : (
                        <DerivedProperty
                            component={StringDropdownPropertyLine}
                            target={property}
                            getValue={() => value as string}
                            setValue={setValue}
                            {...common}
                            options={(property.options ?? []).filter((option): option is { label: string; value: string } => typeof option.value === "string")}
                        />
                    );
                break;
            case "vec2":
                control = (
                    <DerivedProperty
                        component={Vector2PropertyLine}
                        target={property}
                        getValue={() => value as readonly [number, number]}
                        setValue={(_target, next) => commit(property, "x" in next ? [next.x, next.y] : next)}
                        {...common}
                    />
                );
                break;
            case "vec3":
                control = isColor ? (
                    <DerivedProperty
                        component={Color3PropertyLine}
                        target={property}
                        getValue={() => value as readonly [number, number, number]}
                        setValue={(_target, next) => commit(property, "r" in next ? [next.r, next.g, next.b] : next)}
                        {...common}
                        isLinearMode
                    />
                ) : (
                    <DerivedProperty
                        component={Vector3PropertyLine}
                        target={property}
                        getValue={() => value as readonly [number, number, number]}
                        setValue={(_target, next) => commit(property, "x" in next ? [next.x, next.y, next.z] : next)}
                        {...common}
                    />
                );
                break;
            case "vec4":
                control = isColor ? (
                    <DerivedProperty
                        component={Color4PropertyLine}
                        target={property}
                        getValue={() => value as readonly [number, number, number, number]}
                        setValue={(_target, next) => commit(property, "r" in next ? [next.r, next.g, next.b, next.a] : next)}
                        {...common}
                        isLinearMode
                    />
                ) : (
                    <DerivedProperty
                        component={Vector4PropertyLine}
                        target={property}
                        getValue={() => value as readonly [number, number, number, number]}
                        setValue={(_target, next) => commit(property, "x" in next ? [next.x, next.y, next.z, next.w] : next)}
                        {...common}
                    />
                );
                break;
            case "mat4":
                control = <DerivedProperty component={Matrix4Field} target={property} getValue={() => value as Matrix4Value} setValue={setValue} {...common} />;
                break;
        }
    }
    return (
        <div aria-busy={pending}>
            {control}
            {pending ? <Body1 role="status">{`Applying ${label}…`}</Body1> : undefined}
            {error ? <Body1 role="alert">{error}</Body1> : undefined}
        </div>
    );
};

function GetTextureDisplayName(record: ITextureResourceRecord | undefined): string {
    if (!record) {
        return "Texture";
    }
    if (record.metadata.name) {
        return record.metadata.name;
    }

    const kind = record.metadata.kind === "cube" ? "Cube" : record.metadata.kind === "3d" ? "3D" : record.metadata.kind === "2d-array" ? "2D Array" : "2D";
    return `${kind} Texture ${record.ordinal}`;
}

function GetCandidates(record: IMaterialResourceRecord, resourceIndexService: ISceneResourceIndexService): readonly object[] {
    const candidates: object[] = [];
    const seen = new Set<object>();
    for (const scene of record.scenes) {
        for (const texture of resourceIndexService.index.getSceneSnapshot(scene).textures) {
            if (!seen.has(texture.entity)) {
                seen.add(texture.entity);
                candidates.push(texture.entity);
            }
        }
    }
    return candidates;
}

/**
 * Adapts one immutable Lite family snapshot section to runtime-neutral property controls.
 * @param props The selected material, section, and instance-owned services.
 * @returns Runtime-neutral property and texture binding rows.
 */
export const MaterialAdapterSection: FunctionComponent<MaterialFamilyAdapterProps> = (props) => {
    const { material, section, resourceIndexService, selectionService, family, familyDescriptor, colorProperties, getBindingSection } = props;
    let selectedDescriptor: IMaterialDescriptor | undefined;
    try {
        selectedDescriptor = CreateMaterialDescriptorWithFamily(material, familyDescriptor);
    } catch {
        // The selected wrapper may have become stale before the resource index publishes its next snapshot.
    }
    const source = selectedDescriptor?.source;
    const getDescriptor = useCallback(() => {
        if (!source) {
            return undefined;
        }
        const record = resourceIndexService.index.getMaterialRecord(source);
        return record ? CreateMaterialDescriptorWithFamily(material, familyDescriptor) : undefined;
    }, [familyDescriptor, material, resourceIndexService, source]);
    const descriptorSnapshot = useObservableState(getDescriptor, resourceIndexService.onChanged);
    const isResourceIndexDisposed = useCallback(() => resourceIndexService.isDisposed, [resourceIndexService]);
    const [operations, runLatestOperation] = useLatestAsyncOperation(
        material,
        [resourceIndexService.onChanged, resourceIndexService.onDisposed, selectionService.onSelectedEntityChanged],
        isResourceIndexDisposed
    );
    const notifyPropertyChanged = usePropertyChangedNotifier();

    if (!descriptorSnapshot || !source) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }
    if (descriptorSnapshot.family !== family) {
        return <TextPropertyLine label="Error" value={`The material family changed from ${family} to ${descriptorSnapshot.family ?? "unknown"}.`} />;
    }

    const getCurrentRecord = (): IMaterialResourceRecord => {
        const record = resourceIndexService.index.getMaterialRecord(source);
        if (!record) {
            throw new Error("This material is no longer available in an inspected scene.");
        }
        return record;
    };

    const commitProperty = (property: IMaterialDescriptorProperty, value: MaterialDescriptorPropertyValue) => {
        const oldValue = property.value.state === "present" ? property.value.value : undefined;
        runLatestOperation({
            id: property.id,
            operationAsync: async () => {
                const record = getCurrentRecord();
                const scenes = [...record.scenes];
                return await SetMaterialDescriptorPropertyWithFamily({ scenes }, material, property.id, value, familyDescriptor);
            },
            onSuccess: (result) => {
                if (result.changed && oldValue !== undefined) {
                    notifyPropertyChanged(source, property.id, oldValue, value);
                }
                resourceIndexService.refresh();
            },
            getErrorMessage: (error) => (error instanceof Error ? error.message : "The material change failed."),
        });
    };

    const properties = descriptorSnapshot.properties.filter((property) => property.section === section);
    const record = resourceIndexService.index.getMaterialRecord(source);
    const candidates = record ? GetCandidates(record, resourceIndexService) : [];
    const textureBindings = descriptorSnapshot.textureBindings.filter((binding) => (getBindingSection?.(binding) ?? "textures") === section);
    const toTextureModel = (binding: IMaterialTextureBinding): MaterialTextureBindingModel<object> => {
        const current = binding.value.state === "present" ? binding.value.value.entity : null;
        const bindingOperation = operations[binding.id];
        const pending = bindingOperation?.pending ?? false;
        const mutate = (mutation: MaterialTextureMutation) => {
            runLatestOperation({
                id: binding.id,
                operationAsync: async () => {
                    const currentRecord = getCurrentRecord();
                    const scenes = [...currentRecord.scenes];
                    return await SetMaterialDescriptorTextureWithFamily({ scenes }, material, binding.id, mutation, familyDescriptor);
                },
                onSuccess: () => resourceIndexService.refresh(),
                getErrorMessage: (error) => (error instanceof Error ? error.message : "The material texture change failed."),
            });
        };
        const canAssign = binding.value.state === "absent" && binding.directions.includes("assign");
        const canReplace = binding.value.state === "present" && binding.directions.includes("replace");
        const canClear = binding.value.state === "present" && binding.directions.includes("clear");
        const write =
            binding.mutation.access === "read-write"
                ? {
                      assign: canAssign || canReplace ? (texture: object) => mutate({ direction: canAssign ? "assign" : "replace", texture }) : undefined,
                      clear: canClear ? () => mutate({ direction: "clear" }) : undefined,
                  }
                : undefined;
        return {
            id: binding.id,
            label: binding.label,
            value: current,
            candidates,
            getId: (texture) => String(resourceIndexService.index.getTextureRecord(texture)?.ordinal ?? candidates.indexOf(texture)),
            getDisplayName: (texture) => GetTextureDisplayName(resourceIndexService.index.getTextureRecord(texture)),
            getKind: (texture) => (resourceIndexService.index.getTextureRecord(texture)?.metadata.kind ?? "unknown") as TextureBindingKind,
            acceptedKinds: binding.acceptedKinds,
            isCandidateAccepted: (texture) => {
                const textureRecord = resourceIndexService.index.getTextureRecord(texture);
                return (
                    textureRecord !== undefined &&
                    binding.acceptedKinds.includes(textureRecord.metadata.kind as TextureBindingKind) &&
                    (textureRecord.metadata.sampleType === "depth" ? "depth" : "color") === binding.sampleCategory
                );
            },
            write,
            navigate:
                current && binding.directions.includes("navigate")
                    ? (texture) => {
                          const currentBinding = resourceIndexService.index.getMaterialRecord(source)?.bindings.find((candidate) => candidate.id === binding.id);
                          if (!resourceIndexService.isDisposed && currentBinding?.entity === texture) {
                              selectionService.selectedEntity = texture;
                          }
                      }
                    : undefined,
            pending,
            error: bindingOperation?.error ?? (binding.value.state === "unsupported" ? binding.value.reason : undefined),
        };
    };

    return (
        <Fragment>
            {section === "general" ? (
                <>
                    <TextPropertyLine label="Family" value={descriptorSnapshot.family} />
                    <TextPropertyLine label="Selection" value={descriptorSnapshot.isView ? "MaterialView" : "Material"} />
                    {descriptorSnapshot.isView ? <TextPropertyLine label="Source" value={descriptorSnapshot.displayName} /> : undefined}
                </>
            ) : undefined}
            {properties.map((property) => (
                <MaterialField
                    key={property.id}
                    property={property}
                    pending={operations[property.id]?.pending}
                    error={operations[property.id]?.error}
                    isColor={colorProperties?.has(property.id) ?? false}
                    commit={commitProperty}
                />
            ))}
            {textureBindings.map((binding) => (
                <MaterialTextureBindingPropertyLine key={binding.id} model={toTextureModel(binding)} />
            ))}
        </Fragment>
    );
};
