import {
    enableMaterialUvTransform,
    getTextureCoordinateIndex,
    getTextureMetadata,
    getTextureTransform,
    hasTextureTransform,
    markMaterialUboDirty,
    rebuildMaterial,
    setTextureTransform,
    type Material,
    type SceneContext,
    type Texture2D,
    type TextureMetadata,
    type TextureTransform,
} from "@babylonjs/lite";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { type FunctionComponent, useCallback } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { type ISelectionService } from "../../../../services/selectionService";
import { DerivedProperty } from "../../../../components/properties/boundProperty";
import { type ISceneResourceIndexService } from "../scene/sceneResourceIndexService";
import { type IMaterialResourceRecord, type ITextureResourceRecord } from "../scene/sceneResources";
import { useLatestAsyncOperation } from "./useLatestAsyncOperation";

export type TextureMetadataPropertiesProps = Readonly<{
    texture: object;
    resourceIndexService: ISceneResourceIndexService;
    selectionService: ISelectionService;
}>;

type TextureMetadataRow = Readonly<{
    id: string;
    label: string;
    value?: string | number | boolean | null;
    units?: string;
    description?: string;
}>;

const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
});

function OptionalRow(id: string, label: string, value: unknown, units?: string): TextureMetadataRow {
    return value === undefined
        ? { id, label, value: null, description: "Not retained by the Lite texture wrapper." }
        : { id, label, value: typeof value === "string" ? value : String(value), units };
}

function GetMaterialRecord(resourceIndexService: ISceneResourceIndexService, material: Material): IMaterialResourceRecord | undefined {
    return resourceIndexService.index.getMaterialRecord(material);
}

function GetConsumerScenes(record: ITextureResourceRecord | undefined, resourceIndexService: ISceneResourceIndexService): readonly SceneContext[] {
    const scenes = new Set<SceneContext>();
    for (const consumer of record?.consumers ?? []) {
        for (const scene of GetMaterialRecord(resourceIndexService, consumer.material)?.scenes ?? []) {
            scenes.add(scene);
        }
    }
    return [...scenes];
}

function SupportsTransform(record: ITextureResourceRecord | undefined, resourceIndexService: ISceneResourceIndexService): boolean {
    if (!record || record.metadata.kind !== "2d" || !hasTextureTransform(record.entity as Texture2D)) {
        return false;
    }
    return record.consumers.some((consumer) => {
        const materialRecord = GetMaterialRecord(resourceIndexService, consumer.material);
        return (
            (materialRecord?.family === "standard" || materialRecord?.family === "pbr") &&
            consumer.bindingId !== "standard.reflection2d" &&
            consumer.bindingId !== "standard.reflectionCube" &&
            materialRecord.bindings.some((binding) => binding.id === consumer.bindingId && binding.entity === record.entity)
        );
    });
}

function GetMetadataRows(metadata: TextureMetadata, ordinal: number | undefined, texture: object): readonly TextureMetadataRow[] {
    const rows: TextureMetadataRow[] = [
        { id: "identity", label: "Identity", value: ordinal === undefined ? "Unindexed texture" : `Texture ${ordinal}` },
        OptionalRow("name", "Name", metadata.name),
        { id: "kind", label: "Kind", value: metadata.kind },
        OptionalRow("origin", "Origin", metadata.origin),
        OptionalRow("width", "Width", metadata.width, "px"),
        OptionalRow("height", "Height", metadata.height, "px"),
    ];
    if (metadata.kind === "2d-array") {
        rows.push(OptionalRow("layers", "Layers", metadata.layers));
    } else if (metadata.kind === "3d") {
        rows.push(OptionalRow("depth", "Depth", metadata.depth));
    } else if (metadata.kind === "cube") {
        rows.push({ id: "faces", label: "Faces", value: "6" });
    }
    rows.push(
        OptionalRow("format", "Format", metadata.format),
        OptionalRow("mip-levels", "Mip Levels", metadata.mipLevelCount),
        OptionalRow("sample-type", "Sample Type", metadata.sampleType),
        OptionalRow("color-space", "Color Space", metadata.colorSpace),
        OptionalRow("invert-y", "Invert Y", metadata.invertY),
        OptionalRow("address-u", "Address U", metadata.sampler?.addressModeU),
        OptionalRow("address-v", "Address V", metadata.sampler?.addressModeV),
        OptionalRow("address-w", "Address W", metadata.sampler?.addressModeW),
        OptionalRow("min-filter", "Min Filter", metadata.sampler?.minFilter),
        OptionalRow("mag-filter", "Mag Filter", metadata.sampler?.magFilter),
        OptionalRow("mipmap-filter", "Mipmap Filter", metadata.sampler?.mipmapFilter),
        OptionalRow("anisotropy", "Max Anisotropy", metadata.sampler?.maxAnisotropy),
        OptionalRow("dynamic-update", "Dynamic Update", metadata.capabilities.dynamicUpdate),
        OptionalRow("render-attachment", "Render Attachment", metadata.capabilities.renderAttachment),
        OptionalRow("sampled-depth", "Sampled Depth", metadata.capabilities.sampledDepth)
    );
    if (metadata.kind === "2d") {
        rows.push(OptionalRow("coordinates", "Coordinate Index", getTextureCoordinateIndex(texture as Texture2D)));
    }
    if (metadata.width === 0 || metadata.height === 0) {
        rows.push({ id: "availability", label: "Availability", value: "Transient or unavailable" });
    }
    return rows;
}

const TransformFields = [
    ["uScale", "U Scale"],
    ["vScale", "V Scale"],
    ["uOffset", "U Offset"],
    ["vOffset", "V Offset"],
    ["uAng", "Angle"],
] as const;

type TextureTransformFieldProps = Readonly<{
    transform: TextureTransform;
    field: (typeof TransformFields)[number];
    pending?: boolean;
    error?: string;
    commit: (id: string, transform: TextureTransform) => void;
}>;

const TextureTransformField: FunctionComponent<TextureTransformFieldProps> = (props) => {
    const { transform, field, pending, error, commit } = props;
    const [key, label] = field;
    const id = `transform-${key}`;
    return (
        <div aria-busy={pending}>
            <DerivedProperty
                component={NumberInputPropertyLine}
                target={transform}
                getValue={(value) => value[key]}
                setValue={(value, next) => commit(id, { ...value, [key]: next })}
                label={label}
                uniqueId={id}
                disabled={pending}
                description={error ? `Error: ${error}` : undefined}
            />
            {pending ? <Body1 role="status">{`Applying ${label}…`}</Body1> : undefined}
            {error ? <Body1 role="alert">{error}</Body1> : undefined}
        </div>
    );
};

/**
 * Displays metadata properties for one exact Lite texture wrapper.
 * @param props - The exact texture, resource index, and selection service.
 * @returns The metadata-only texture properties UI.
 */
export const TextureMetadataProperties: FunctionComponent<TextureMetadataPropertiesProps> = (props) => {
    const { texture, resourceIndexService, selectionService } = props;
    const classes = useStyles();
    const getSnapshot = useCallback(() => {
        const record = resourceIndexService.index.getTextureRecord(texture);
        try {
            const metadata = getTextureMetadata(texture);
            return metadata ? { metadata, record } : undefined;
        } catch {
            return undefined;
        }
    }, [resourceIndexService, texture]);
    const snapshot = useObservableState(getSnapshot, resourceIndexService.onChanged);
    const isResourceIndexDisposed = useCallback(() => resourceIndexService.isDisposed, [resourceIndexService]);
    const [operations, runLatestOperation] = useLatestAsyncOperation(
        texture,
        [resourceIndexService.onChanged, resourceIndexService.onDisposed, selectionService.onSelectedEntityChanged],
        isResourceIndexDisposed
    );

    if (!snapshot) {
        return (
            <div className={classes.section} role="alert">
                <TextPropertyLine label="Error" value="This texture is unavailable or malformed." />
            </div>
        );
    }

    const { metadata, record } = snapshot;
    const canEditTransform = SupportsTransform(record, resourceIndexService);
    const transform = canEditTransform ? getTextureTransform(texture as Texture2D) : undefined;
    const commitTransform = (id: string, transform: TextureTransform) => {
        runLatestOperation({
            id,
            operationAsync: async () => {
                const currentRecord = resourceIndexService.index.getTextureRecord(texture);
                if (!currentRecord) {
                    throw new Error("This texture is no longer available in an inspected scene.");
                }
                const consumerRecords = currentRecord.consumers.map((consumer) => GetMaterialRecord(resourceIndexService, consumer.material));
                if (consumerRecords.some((item) => item === undefined || item.scenes.length === 0)) {
                    throw new Error("The texture has an incomplete owning scene scope.");
                }
                const scenes = [...GetConsumerScenes(currentRecord, resourceIndexService)];
                const materialRecords = [
                    ...new Set(consumerRecords.filter((item): item is IMaterialResourceRecord => item !== undefined && (item.family === "standard" || item.family === "pbr"))),
                ];
                if (scenes.length === 0 || materialRecords.length === 0) {
                    throw new Error("The texture has no complete owning scene scope.");
                }
                const currentTransform = getTextureTransform(texture as Texture2D);
                if (
                    currentTransform &&
                    currentTransform.uOffset === transform.uOffset &&
                    currentTransform.vOffset === transform.vOffset &&
                    currentTransform.uScale === transform.uScale &&
                    currentTransform.vScale === transform.vScale &&
                    currentTransform.uAng === transform.uAng
                ) {
                    return false;
                }
                const changed = setTextureTransform(texture as Texture2D, transform);
                if (!changed) {
                    return false;
                }
                await Promise.all(
                    materialRecords.flatMap((materialRecord) => {
                        const requiresRebuild = enableMaterialUvTransform(materialRecord.source);
                        markMaterialUboDirty(materialRecord.source);
                        return requiresRebuild
                            ? materialRecord.scenes.map(
                                  async (scene) =>
                                      // The repository-pinned Lite declarations predate direct rebuild completion.
                                      // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/return-await
                                      await rebuildMaterial(scene, materialRecord.source, {
                                          rebuildViews: true,
                                          rebuildFrameGraph: false,
                                      })
                              )
                            : [];
                    })
                );
                return true;
            },
            onSuccess: () => resourceIndexService.refresh(),
            getErrorMessage: (error) => (error instanceof Error ? error.message : "The texture transform change failed."),
        });
    };
    return (
        <div className={classes.section}>
            {GetMetadataRows(metadata, record?.ordinal, texture).map((row) => {
                return (
                    <div key={row.id}>
                        {typeof row.value === "boolean" ? (
                            <BooleanBadgePropertyLine label={row.label} uniqueId={row.id} value={row.value} description={row.description} />
                        ) : typeof row.value === "number" ? (
                            <StringifiedPropertyLine label={row.label} uniqueId={row.id} value={row.value} units={row.units} description={row.description} />
                        ) : (
                            <TextPropertyLine label={row.label} uniqueId={row.id} value={row.value == null ? "Unavailable" : row.value} description={row.description} />
                        )}
                    </div>
                );
            })}
            {transform
                ? TransformFields.map((field) => {
                      const id = `transform-${field[0]}`;
                      return (
                          <TextureTransformField
                              key={id}
                              transform={transform}
                              field={field}
                              pending={operations[id]?.pending}
                              error={operations[id]?.error}
                              commit={commitTransform}
                          />
                      );
                  })
                : undefined}
            {record?.consumers.map((consumer, index) => {
                const materialRecord = GetMaterialRecord(resourceIndexService, consumer.material);
                const value = materialRecord?.displayName ?? "Unavailable material";
                return (
                    <LinkPropertyLine
                        key={`consumer-${index}-${consumer.bindingId}`}
                        label={consumer.bindingId}
                        uniqueId={`consumer-${index}-${consumer.bindingId}`}
                        value={value}
                        onLink={
                            materialRecord
                                ? () => {
                                      const currentRecord = resourceIndexService.index.getTextureRecord(texture);
                                      const currentConsumer = currentRecord?.consumers.find(
                                          (candidate) => candidate.material === consumer.material && candidate.bindingId === consumer.bindingId
                                      );
                                      const currentMaterialRecord = currentConsumer && GetMaterialRecord(resourceIndexService, currentConsumer.material);
                                      if (!resourceIndexService.isDisposed && currentMaterialRecord) {
                                          selectionService.selectedEntity = currentMaterialRecord.source;
                                      }
                                  }
                                : undefined
                        }
                        aria-label={materialRecord ? `Open material ${value}, ${consumer.bindingId}` : undefined}
                    />
                );
            })}
        </div>
    );
};
