import {
    inspectMaterial,
    setMaterialInspectionProperty,
    setMaterialInspectionTexture,
    type Material,
    type MaterialInspection,
    type MaterialInspectionProperty,
    type MaterialInspectionPropertyId,
    type MaterialInspectionPropertyValue,
    type MaterialInspectionSection,
    type MaterialTextureBinding,
    type MaterialTextureMutation,
    type TextureBindingKind,
} from "@babylonjs/lite";
import { Fragment, type FunctionComponent, useCallback, useState } from "react";

import { MaterialPropertySection, type MaterialMatrix4Value, type MaterialPropertyModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import { MaterialTextureBindingPropertyLine, type MaterialTextureBindingModel } from "shared-ui-components/fluent/hoc/propertyLines/materialTextureBindingPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { usePropertyChangedNotifier } from "../../../../../contexts/propertyContext";
import { type ISelectionService } from "../../../../../services/selectionService";
import { type ILiteSceneResourceIndexService } from "../../scene/sceneResourceIndexService";
import { type ILiteMaterialResourceRecord, type ILiteTextureResourceRecord } from "../../scene/sceneResources";

/** Props shared by each lazily loaded Lite material family adapter. */
export type LiteMaterialAdapterProps = Readonly<{
    material: Material;
    section: MaterialInspectionSection;
    resourceIndexService: ILiteSceneResourceIndexService;
    selectionService: ISelectionService;
}>;

type MaterialOperationState = Readonly<{
    id?: string;
    pending: boolean;
    error?: string;
}>;

type MaterialFamilyAdapterProps = LiteMaterialAdapterProps &
    Readonly<{
        family: "standard" | "pbr" | "shader" | "node";
        colorProperties?: ReadonlySet<MaterialInspectionPropertyId>;
        getBindingSection?: (binding: MaterialTextureBinding) => MaterialInspectionSection;
    }>;

function FormatInspectionValue(value: MaterialInspectionPropertyValue): string {
    return Array.isArray(value) ? `[${value.join(", ")}]` : String(value);
}

function GetUnavailablePropertyModel(property: MaterialInspectionProperty): MaterialPropertyModel {
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
    if (record.inspection.displayName.state === "known" && record.inspection.displayName.value) {
        return record.inspection.displayName.value;
    }

    const kind = record.inspection.kind === "cube" ? "Cube" : record.inspection.kind === "3d" ? "3D" : record.inspection.kind === "2d-array" ? "2D Array" : "2D";
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
    const { material, section, resourceIndexService, selectionService, family, colorProperties, getBindingSection } = props;
    let selectedInspection: MaterialInspection | undefined;
    try {
        selectedInspection = inspectMaterial(material);
    } catch {
        // The selected wrapper may have become stale before the resource index publishes its next snapshot.
    }
    const source = selectedInspection?.source;
    const isView = selectedInspection?.isView ?? false;
    const getInspection = useCallback(() => {
        if (!source) {
            return undefined;
        }
        const record = resourceIndexService.index.getMaterialRecord(source);
        return record ? ({ ...record.inspection, isView } satisfies MaterialInspection) : undefined;
    }, [isView, resourceIndexService, source]);
    const inspection = useObservableState(getInspection, resourceIndexService.onChanged);
    const [operation, setOperation] = useState<MaterialOperationState>({ pending: false });
    const notifyPropertyChanged = usePropertyChangedNotifier();

    if (!inspection || !source) {
        return <TextPropertyLine label="Error" value="This material is no longer available in an inspected scene." />;
    }
    if (inspection.family !== family) {
        return <TextPropertyLine label="Error" value={`The material family changed from ${family} to ${inspection.family ?? "unknown"}.`} />;
    }

    const runOperationAsync = async (id: string, operationCallback: () => Promise<{ changed: boolean }>, oldValue?: unknown, newValue?: unknown) => {
        setOperation({ id, pending: true });
        try {
            const result = await operationCallback();
            if (result.changed && oldValue !== undefined) {
                notifyPropertyChanged(source, id, oldValue, newValue);
            }
            resourceIndexService.refresh();
            setOperation({ pending: false });
        } catch (error) {
            setOperation({
                id,
                pending: false,
                error: error instanceof Error ? error.message : "The material change failed.",
            });
        }
    };

    const getCurrentRecord = (): ILiteMaterialResourceRecord => {
        const record = resourceIndexService.index.getMaterialRecord(source);
        if (!record) {
            throw new Error("This material is no longer available in an inspected scene.");
        }
        return record;
    };

    const commitProperty = (property: MaterialInspectionProperty, value: MaterialInspectionPropertyValue) => {
        const oldValue = property.value.state === "present" ? property.value.value : undefined;
        void runOperationAsync(
            property.id,
            async () => {
                const record = getCurrentRecord();
                return await setMaterialInspectionProperty({ scenes: record.scenes }, material, property.id, value);
            },
            oldValue,
            value
        );
    };

    const toPropertyModel = (property: MaterialInspectionProperty): MaterialPropertyModel => {
        if (property.value.state !== "present" || property.access.access !== "read-write" || property.valueType === "summary") {
            if (property.value.state === "present") {
                return {
                    kind: "readonly",
                    id: property.id,
                    label: property.label,
                    value: FormatInspectionValue(property.value.value),
                    description: property.access.access === "read-only" ? property.access.reason : undefined,
                };
            }
            return GetUnavailablePropertyModel(property);
        }

        const common = {
            id: property.id,
            label: property.label,
            disabled: operation.pending && operation.id === property.id,
            error: operation.id === property.id ? operation.error : undefined,
        };
        const value = property.value.value;
        switch (property.valueType) {
            case "boolean":
                return { ...common, kind: "boolean", value: value as boolean, onChange: (next) => commitProperty(property, next) };
            case "string":
                return { ...common, kind: "string", value: value as string, onChange: (next) => commitProperty(property, next) };
            case "number":
                return {
                    ...common,
                    kind: "number",
                    value: value as number,
                    onChange: (next) => commitProperty(property, next),
                    min: property.access.number?.min,
                    max: property.access.number?.max,
                    step: property.access.number?.integer ? 1 : undefined,
                };
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
                    ? {
                          ...common,
                          kind: "color",
                          linear: true,
                          value: { r: tuple[0], g: tuple[1], b: tuple[2] },
                          onChange: (next) => commitProperty(property, [next.r, next.g, next.b]),
                      }
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

    const properties = inspection.properties.filter((property) => property.section === section).map(toPropertyModel);
    const record = resourceIndexService.index.getMaterialRecord(source);
    const candidates = record ? GetCandidates(record, resourceIndexService) : [];
    const textureBindings = inspection.textureBindings.filter((binding) => (getBindingSection?.(binding) ?? "textures") === section);
    const toTextureModel = (binding: MaterialTextureBinding): MaterialTextureBindingModel<object> => {
        const current = binding.value.state === "present" ? binding.value.value.entity : null;
        const pending = operation.pending && operation.id === binding.id;
        const mutate = (mutation: MaterialTextureMutation) =>
            void runOperationAsync(binding.id, async () => {
                const currentRecord = getCurrentRecord();
                return await setMaterialInspectionTexture({ scenes: currentRecord.scenes }, material, binding.id, mutation);
            });
        const canAssign = binding.value.state === "absent" && binding.directions.includes("assign");
        const canReplace = binding.value.state === "present" && binding.directions.includes("replace");
        const canClear = binding.value.state === "present" && binding.directions.includes("clear");
        const write =
            !pending && binding.mutation.access === "read-write"
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
            getKind: (texture) => (resourceIndexService.index.getTextureRecord(texture)?.inspection.kind ?? "unknown") as TextureBindingKind,
            acceptedKinds: binding.acceptedKinds,
            write,
            navigate:
                current && binding.directions.includes("navigate")
                    ? (texture) => {
                          selectionService.selectedEntity = texture;
                      }
                    : undefined,
            pending,
            error: operation.id === binding.id ? operation.error : binding.value.state === "unsupported" ? binding.value.reason : undefined,
        };
    };

    return (
        <Fragment>
            {section === "general" ? (
                <>
                    <TextPropertyLine label="Family" value={inspection.family} />
                    <TextPropertyLine label="Selection" value={inspection.isView ? "MaterialView" : "Material"} />
                    {inspection.isView ? <TextPropertyLine label="Source" value={inspection.displayName} /> : undefined}
                </>
            ) : undefined}
            {operation.pending && (properties.some((property) => property.id === operation.id) || textureBindings.some((binding) => binding.id === operation.id)) ? (
                <TextPropertyLine label="Status" value="Applying change…" />
            ) : undefined}
            {properties.length ? <MaterialPropertySection model={{ fields: properties }} /> : undefined}
            {textureBindings.map((binding) => (
                <MaterialTextureBindingPropertyLine key={binding.id} model={toTextureModel(binding)} />
            ))}
        </Fragment>
    );
};
