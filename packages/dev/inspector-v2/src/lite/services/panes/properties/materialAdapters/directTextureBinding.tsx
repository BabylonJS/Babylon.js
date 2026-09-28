import { type Material } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { MaterialTextureBindingPropertyLine, type MaterialTextureBindingModel } from "shared-ui-components/fluent/hoc/propertyLines/materialTextureBindingPropertyLine";

import { type ISelectionService } from "../../../../../services/selectionService";
import { type ISceneResourceIndexService } from "../../scene/sceneResourceIndexService";
import { type IMaterialResourceRecord, type ITextureResourceRecord } from "../../scene/sceneResources";
import { type useDirectMaterialOperations } from "./useDirectMaterialOperations";

type DirectOperations = ReturnType<typeof useDirectMaterialOperations>;

export type DirectTextureBindingProps = Readonly<{
    source: Material;
    record: IMaterialResourceRecord;
    resourceIndexService: ISceneResourceIndexService;
    selectionService: ISelectionService;
    operations: DirectOperations["operations"];
    commit: DirectOperations["commit"];
    id: string;
    label: string;
    value: object | null | undefined;
    acceptedKinds: readonly string[];
    sampleCategory?: "float" | "depth";
    canClear?: boolean;
    invalidate: "rebuild" | "owned";
    apply: (texture: object | null) => void | Promise<void>;
}>;

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

function AcceptsSampleType(sampleType: string | undefined, category: "float" | "depth"): boolean {
    return category === "depth" ? sampleType === "depth" : sampleType === undefined || sampleType === "float" || sampleType === "unfilterable-float";
}

/**
 * Connects one family-owned Lite texture slot to the runtime-neutral directional control.
 * @param props The slot getter result, supported directions, and Inspector-owned services.
 * @returns The navigable texture binding row.
 */
export const DirectTextureBinding: FunctionComponent<DirectTextureBindingProps> = (props) => {
    const {
        source,
        record,
        resourceIndexService,
        selectionService,
        operations,
        commit,
        id,
        label,
        value,
        acceptedKinds,
        sampleCategory = "float",
        canClear = true,
        invalidate,
        apply,
    } = props;
    const currentRecord = value ? resourceIndexService.index.getTextureRecord(value) : undefined;
    const unsupported = value && (!currentRecord || !acceptedKinds.includes(currentRecord.metadata.kind) || !AcceptsSampleType(currentRecord.metadata.sampleType, sampleCategory));
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
    const mutate = (texture: object | null) => {
        commit({
            id,
            oldValue: value ?? null,
            newValue: texture,
            apply: (): void | Promise<void> => {
                const current = resourceIndexService.index.getMaterialRecord(source)?.bindings.find((binding) => binding.id === id)?.entity;
                if ((current ?? null) !== (value ?? null)) {
                    throw new Error(`Texture binding "${id}" is stale.`);
                }
                const metadata = texture && resourceIndexService.index.getTextureRecord(texture)?.metadata;
                if (texture && (!metadata || !acceptedKinds.includes(metadata.kind) || !AcceptsSampleType(metadata.sampleType, sampleCategory))) {
                    throw new TypeError(`Texture binding "${id}" does not accept this texture.`);
                }
                return apply(texture);
            },
            invalidate,
        });
    };
    const model: MaterialTextureBindingModel<object> = {
        id,
        label,
        value: unsupported ? null : (value ?? null),
        candidates,
        getId: (texture) => String(resourceIndexService.index.getTextureRecord(texture)?.ordinal ?? candidates.indexOf(texture)),
        getDisplayName: (texture) => GetTextureDisplayName(resourceIndexService.index.getTextureRecord(texture)),
        getKind: (texture) => resourceIndexService.index.getTextureRecord(texture)?.metadata.kind ?? "unknown",
        acceptedKinds,
        isCandidateAccepted: (texture) => {
            const metadata = resourceIndexService.index.getTextureRecord(texture)?.metadata;
            return !!metadata && AcceptsSampleType(metadata.sampleType, sampleCategory);
        },
        write: unsupported
            ? undefined
            : {
                  assign: (texture) => mutate(texture),
                  clear: value && canClear ? () => mutate(null) : undefined,
              },
        navigate:
            value && !unsupported
                ? (texture) => {
                      const binding = resourceIndexService.index.getMaterialRecord(source)?.bindings.find((candidate) => candidate.id === id);
                      if (!resourceIndexService.isDisposed && binding?.entity === texture) {
                          selectionService.selectedEntity = texture;
                      }
                  }
                : undefined,
        pending: operations[id]?.pending,
        error: operations[id]?.error ?? (unsupported ? `${label} contains an unsupported texture value.` : undefined),
    };
    return <MaterialTextureBindingPropertyLine model={model} />;
};
