import {
    inspectTexture,
    setTextureInspectionTransform,
    type InspectionDatum,
    type InspectionValue,
    type Material,
    type SceneContext,
    type TextureInspection,
    type TextureInspectionTransform,
} from "@babylonjs/lite";
import { type FunctionComponent, useCallback } from "react";

import {
    TextureMetadataProperties,
    type TextureMetadataConsumerLink,
    type TextureMetadataModel,
    type TextureMetadataRow,
} from "shared-ui-components/fluent/hoc/propertyLines/textureMetadataProperties";
import { type MaterialPropertyModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { type ISelectionService } from "../../../../services/selectionService";
import { type ILiteSceneResourceIndexService } from "../scene/sceneResourceIndexService";
import { type ILiteMaterialResourceRecord, type ILiteTextureResourceRecord } from "../scene/sceneResources";
import { useLatestAsyncOperation } from "./useLatestAsyncOperation";

export type LiteTextureMetadataAdapterProps = Readonly<{
    texture: object;
    resourceIndexService: ILiteSceneResourceIndexService;
    selectionService: ISelectionService;
}>;

function FormatValue(value: unknown): string {
    return typeof value === "string" ? value : String(value);
}

function DatumRow<T>(id: string, label: string, datum: InspectionDatum<T>, format: (value: T) => string = FormatValue): TextureMetadataRow {
    return datum.state === "known"
        ? { id, label, value: format(datum.value) }
        : { id, label, value: null, description: datum.reason ?? "Not retained by the Lite texture wrapper." };
}

function ValueRow<T>(id: string, label: string, value: InspectionValue<T>, format: (item: T) => string = FormatValue): TextureMetadataRow {
    switch (value.state) {
        case "present":
            return { id, label, value: format(value.value) };
        case "unsupported":
            return { id, label, value: null, description: value.reason };
        case "absent":
            return { id, label, value: null, description: "Not present." };
    }
}

function GetMaterialRecord(resourceIndexService: ILiteSceneResourceIndexService, material: Material): ILiteMaterialResourceRecord | undefined {
    return resourceIndexService.index.getMaterialRecord(material);
}

function GetConsumerLinks(
    texture: object,
    record: ILiteTextureResourceRecord | undefined,
    resourceIndexService: ILiteSceneResourceIndexService,
    selectionService: ISelectionService
): readonly TextureMetadataConsumerLink[] {
    if (!record) {
        return [];
    }

    return record.consumers.map((consumer, index) => {
        const materialRecord = GetMaterialRecord(resourceIndexService, consumer.material);
        const binding = materialRecord?.bindings.find((candidate) => candidate.id === consumer.bindingId);
        const materialName = materialRecord?.inspection.displayName ?? "Unavailable material";
        return {
            id: `consumer-${index}-${consumer.bindingId}`,
            label: binding?.label ?? consumer.bindingId,
            value: materialName,
            navigate: materialRecord
                ? () => {
                      const currentRecord = resourceIndexService.index.getTextureRecord(texture);
                      const currentConsumer = currentRecord?.consumers.find((candidate) => candidate.material === consumer.material && candidate.bindingId === consumer.bindingId);
                      const currentMaterialRecord = currentConsumer && GetMaterialRecord(resourceIndexService, currentConsumer.material);
                      if (!resourceIndexService.isDisposed && currentMaterialRecord) {
                          selectionService.selectedEntity = currentMaterialRecord.source;
                      }
                  }
                : undefined,
        };
    });
}

function GetConsumerScenes(record: ILiteTextureResourceRecord | undefined, resourceIndexService: ILiteSceneResourceIndexService): readonly SceneContext[] {
    const scenes = new Set<SceneContext>();
    for (const consumer of record?.consumers ?? []) {
        for (const scene of GetMaterialRecord(resourceIndexService, consumer.material)?.scenes ?? []) {
            scenes.add(scene);
        }
    }
    return [...scenes];
}

function SupportsTransform(record: ILiteTextureResourceRecord | undefined, resourceIndexService: ILiteSceneResourceIndexService): boolean {
    if (!record || record.inspection.kind !== "2d" || record.inspection.transform.state !== "present") {
        return false;
    }

    return record.consumers.some((consumer) => {
        const materialRecord = GetMaterialRecord(resourceIndexService, consumer.material);
        const family = materialRecord?.inspection.family;
        const binding = materialRecord?.bindings.find((candidate) => candidate.id === consumer.bindingId);
        return (
            (family === "standard" || family === "pbr") &&
            binding?.value.state === "present" &&
            binding.value.value.entity === record.entity &&
            binding.transform.state === "present"
        );
    });
}

function GetMetadataRows(inspection: TextureInspection, ordinal: number | undefined): readonly TextureMetadataRow[] {
    const rows: TextureMetadataRow[] = [
        { id: "identity", label: "Identity", value: ordinal === undefined ? "Unindexed texture" : `Texture ${ordinal}` },
        DatumRow("name", "Name", inspection.displayName),
        { id: "kind", label: "Kind", value: inspection.kind },
        DatumRow("origin", "Origin", inspection.origin),
        { id: "width", label: "Width", value: inspection.width, units: "px" },
        { id: "height", label: "Height", value: inspection.height, units: "px" },
    ];

    if (inspection.kind === "2d-array") {
        rows.push(DatumRow("layers", "Layers", inspection.depthOrLayers));
    } else if (inspection.kind === "3d") {
        rows.push(DatumRow("depth", "Depth", inspection.depthOrLayers));
    } else if (inspection.kind === "cube") {
        rows.push(DatumRow("faces", "Faces", inspection.depthOrLayers));
    }

    rows.push(
        DatumRow("format", "Format", inspection.format),
        DatumRow("mip-levels", "Mip Levels", inspection.mipLevelCount),
        { id: "sample-category", label: "Sample Category", value: inspection.sampleCategory },
        { id: "color-space", label: "Color Space", value: inspection.colorSpace },
        ValueRow("invert-y", "Invert Y", inspection.invertY),
        DatumRow("address-u", "Address U", inspection.sampler.addressModeU),
        DatumRow("address-v", "Address V", inspection.sampler.addressModeV),
        DatumRow("address-w", "Address W", inspection.sampler.addressModeW),
        DatumRow("min-filter", "Min Filter", inspection.sampler.minFilter),
        DatumRow("mag-filter", "Mag Filter", inspection.sampler.magFilter),
        DatumRow("mipmap-filter", "Mipmap Filter", inspection.sampler.mipmapFilter),
        DatumRow("anisotropy", "Max Anisotropy", inspection.sampler.maxAnisotropy),
        DatumRow("dynamic-update", "Dynamic Update", inspection.capabilities.dynamicUpdate),
        DatumRow("html-readiness", "HTML Readiness", inspection.capabilities.htmlReadiness),
        DatumRow("render-attachment", "Render Attachment", inspection.capabilities.renderAttachment),
        { id: "sampled-depth", label: "Sampled Depth", value: inspection.capabilities.sampledDepth },
        DatumRow("released", "Released", inspection.capabilities.released)
    );

    if (inspection.width === 0 || inspection.height === 0) {
        rows.push({ id: "availability", label: "Availability", value: "Transient or unavailable" });
    }
    return rows;
}

function GetTransformFields(
    transform: TextureInspectionTransform,
    operationId: string | undefined,
    pending: boolean,
    error: string | undefined,
    commit: (id: string, transform: TextureInspectionTransform) => void
): readonly MaterialPropertyModel[] {
    const definitions = [
        ["uScale", "U Scale"],
        ["vScale", "V Scale"],
        ["uOffset", "U Offset"],
        ["vOffset", "V Offset"],
        ["uAng", "Angle"],
    ] as const;
    return definitions.map(([key, label]) => ({
        kind: "number",
        id: `transform-${key}`,
        label,
        value: transform[key],
        disabled: pending && operationId === `transform-${key}`,
        error: operationId === `transform-${key}` ? error : undefined,
        onChange: (value: number) => commit(`transform-${key}`, { ...transform, [key]: value }),
    }));
}

/**
 * Lazily adapts one exact Lite texture wrapper to the runtime-neutral metadata component.
 * @param props The selected wrapper and Inspector-owned services.
 * @returns Metadata, consumer links, and supported transform controls.
 */
export const LiteTextureMetadataAdapter: FunctionComponent<LiteTextureMetadataAdapterProps> = (props) => {
    const { texture, resourceIndexService, selectionService } = props;
    const getSnapshot = useCallback(() => {
        const record = resourceIndexService.index.getTextureRecord(texture);
        if (record) {
            return { inspection: record.inspection, record };
        }
        try {
            const inspection = inspectTexture(texture);
            return inspection ? { inspection, record: undefined } : undefined;
        } catch {
            return undefined;
        }
    }, [resourceIndexService, texture]);
    const snapshot = useObservableState(getSnapshot, resourceIndexService.onChanged);
    const isResourceIndexDisposed = useCallback(() => resourceIndexService.isDisposed, [resourceIndexService]);
    const [operation, runLatestOperation] = useLatestAsyncOperation(
        texture,
        [resourceIndexService.onChanged, resourceIndexService.onDisposed, selectionService.onSelectedEntityChanged],
        isResourceIndexDisposed
    );

    if (!snapshot) {
        return <TextureMetadataProperties model={{ rows: [], error: "This texture is unavailable or malformed." }} />;
    }

    const { inspection, record } = snapshot;
    const canEditTransform = SupportsTransform(record, resourceIndexService);
    const commitTransform = (id: string, transform: TextureInspectionTransform) => {
        runLatestOperation({
            id,
            operationAsync: async () => {
                const currentRecord = resourceIndexService.index.getTextureRecord(texture);
                if (!currentRecord) {
                    throw new Error("This texture is no longer available in an inspected scene.");
                }
                const scenes = [...GetConsumerScenes(currentRecord, resourceIndexService)];
                return await setTextureInspectionTransform({ scenes }, texture, transform);
            },
            onSuccess: () => resourceIndexService.refresh(),
            getErrorMessage: (error) => (error instanceof Error ? error.message : "The texture transform change failed."),
        });
    };
    const model: TextureMetadataModel = {
        rows: GetMetadataRows(inspection, record?.ordinal),
        consumers: GetConsumerLinks(texture, record, resourceIndexService, selectionService),
        pending: operation.pending,
        transform:
            canEditTransform && inspection.transform.state === "present"
                ? {
                      fields: GetTransformFields(inspection.transform.value, operation.id, operation.pending, operation.error, commitTransform),
                  }
                : undefined,
    };
    return <TextureMetadataProperties model={model} />;
};
