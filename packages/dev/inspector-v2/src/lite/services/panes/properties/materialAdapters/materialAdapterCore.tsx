import { type Material } from "@babylonjs/lite";
import { Fragment, type FunctionComponent, useCallback } from "react";

import { MaterialPropertySection, type MaterialMatrix4Value, type MaterialPropertyModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import {
    CreateBooleanMaterialPropertyModel,
    CreateColor3MaterialPropertyModel,
    CreateNumberMaterialPropertyModel,
} from "shared-ui-components/lite/fluent/hoc/propertyLines/materialPropertyAdapters";
import { MaterialTextureBindingPropertyLine, type MaterialTextureBindingModel } from "shared-ui-components/fluent/hoc/propertyLines/materialTextureBindingPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { usePropertyChangedNotifier } from "../../../../../contexts/propertyContext";
import { type ISelectionService } from "../../../../../services/selectionService";
import { type ILiteSceneResourceIndexService } from "../../scene/sceneResourceIndexService";
import { type ILiteMaterialResourceRecord, type ILiteTextureResourceRecord } from "../../scene/sceneResources";
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
    type MaterialDescriptorSection,
    type IMaterialTextureBinding,
    type MaterialTextureMutation,
    type TextureBindingKind,
} from "../descriptors/descriptorTypes";
import { useLatestAsyncOperation } from "../useLatestAsyncOperation";

/** Props shared by each lazily loaded Lite material family adapter. */
export type LiteMaterialAdapterProps = Readonly<{
    material: Material;
    section: MaterialDescriptorSection;
    resourceIndexService: ILiteSceneResourceIndexService;
    selectionService: ISelectionService;
}>;

type MaterialFamilyAdapterProps = LiteMaterialAdapterProps &
    Readonly<{
        family: "standard" | "pbr" | "shader" | "node";
        familyDescriptor: IMaterialDescriptorFamilyDescriptor;
        colorProperties?: ReadonlySet<MaterialDescriptorPropertyId>;
        getBindingSection?: (binding: IMaterialTextureBinding) => MaterialDescriptorSection;
    }>;

function FormatDescriptorValue(value: MaterialDescriptorPropertyValue): string {
    return Array.isArray(value) ? `[${value.join(", ")}]` : String(value);
}

function GetUnavailablePropertyModel(property: IMaterialDescriptorProperty): MaterialPropertyModel {
    const value = property.value.state === "absent" ? "Not configured" : property.value.state === "unsupported" ? `Unavailable: ${property.value.reason}` : "Unavailable";
    return {
        kind: "readonly",
        id: property.id,
        label: property.label,
        value,
        description: property.access.access === "read-only" ? property.access.reason : undefined,
    };
}

function GetTextureDisplayName(record: ILiteTextureResourceRecord | undefined): string {
    if (!record) {
        return "Texture";
    }
    if (record.metadata.name) {
        return record.metadata.name;
    }

    const kind = record.metadata.kind === "cube" ? "Cube" : record.metadata.kind === "3d" ? "3D" : record.metadata.kind === "2d-array" ? "2D Array" : "2D";
    return `${kind} Texture ${record.ordinal}`;
}

function GetCandidates(record: ILiteMaterialResourceRecord, resourceIndexService: ILiteSceneResourceIndexService): readonly object[] {
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
export const LiteMaterialAdapterSection: FunctionComponent<MaterialFamilyAdapterProps> = (props) => {
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

    const getCurrentRecord = (): ILiteMaterialResourceRecord => {
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

    const toPropertyModel = (property: IMaterialDescriptorProperty): MaterialPropertyModel => {
        if (property.value.state !== "present" || property.access.access !== "read-write" || property.valueType === "summary") {
            if (property.value.state === "present") {
                return {
                    kind: "readonly",
                    id: property.id,
                    label: property.label,
                    value: FormatDescriptorValue(property.value.value),
                    description: property.access.access === "read-only" ? property.access.reason : undefined,
                };
            }
            return GetUnavailablePropertyModel(property);
        }

        const common = {
            id: property.id,
            label: property.label,
            disabled: operations[property.id]?.pending,
            pending: operations[property.id]?.pending,
            error: operations[property.id]?.error,
        };
        const value = property.value.value;
        switch (property.valueType) {
            case "boolean":
                return CreateBooleanMaterialPropertyModel({ ...common, label: property.label, value: value as boolean, onChange: (next) => commitProperty(property, next) });
            case "string":
                return { ...common, kind: "string", value: value as string, onChange: (next) => commitProperty(property, next) };
            case "number":
                return CreateNumberMaterialPropertyModel({
                    ...common,
                    label: property.label,
                    value: value as number,
                    onChange: (next) => commitProperty(property, next),
                    min: property.access.number?.min,
                    max: property.access.number?.max,
                    step: property.access.number?.integer ? 1 : undefined,
                });
            case "enum": {
                const options = property.options ?? [];
                return typeof value === "number"
                    ? {
                          ...common,
                          kind: "number-options",
                          value,
                          options: options as readonly { label: string; value: number }[],
                          onChange: (next) => commitProperty(property, next),
                      }
                    : {
                          ...common,
                          kind: "string-options",
                          value: value as string,
                          options: options as readonly { label: string; value: string }[],
                          onChange: (next) => commitProperty(property, next),
                      };
            }
            case "vec2": {
                const tuple = value as readonly [number, number];
                return { ...common, kind: "vector2", value: { x: tuple[0], y: tuple[1] }, onChange: (next) => commitProperty(property, [next.x, next.y]) };
            }
            case "vec3": {
                const tuple = value as readonly [number, number, number];
                return colorProperties?.has(property.id)
                    ? CreateColor3MaterialPropertyModel({
                          ...common,
                          label: property.label,
                          linear: true,
                          value: tuple,
                          onChange: (next) => commitProperty(property, next),
                      })
                    : { ...common, kind: "vector3", value: { x: tuple[0], y: tuple[1], z: tuple[2] }, onChange: (next) => commitProperty(property, [next.x, next.y, next.z]) };
            }
            case "vec4": {
                const tuple = value as readonly [number, number, number, number];
                return colorProperties?.has(property.id)
                    ? {
                          ...common,
                          kind: "color",
                          linear: true,
                          value: { r: tuple[0], g: tuple[1], b: tuple[2], a: tuple[3] },
                          onChange: (next) => commitProperty(property, [next.r, next.g, next.b, next.a ?? tuple[3]]),
                      }
                    : {
                          ...common,
                          kind: "vector4",
                          value: { x: tuple[0], y: tuple[1], z: tuple[2], w: tuple[3] },
                          onChange: (next) => commitProperty(property, [next.x, next.y, next.z, next.w]),
                      };
            }
            case "mat4":
                return {
                    ...common,
                    kind: "matrix4",
                    value: value as unknown as MaterialMatrix4Value,
                    onChange: (next) => commitProperty(property, next),
                };
        }
    };

    const properties = descriptorSnapshot.properties.filter((property) => property.section === section).map(toPropertyModel);
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
            {properties.length ? <MaterialPropertySection model={{ fields: properties }} /> : undefined}
            {textureBindings.map((binding) => (
                <MaterialTextureBindingPropertyLine key={binding.id} model={toTextureModel(binding)} />
            ))}
        </Fragment>
    );
};
