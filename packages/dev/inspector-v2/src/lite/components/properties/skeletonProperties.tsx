import { getMeshSkeleton, type Bone, type EngineContext, type Mesh, type Skeleton } from "@babylonjs/lite";
import { type FunctionComponent, useCallback } from "react";

import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Link } from "shared-ui-components/fluent/primitives/link";

import { GetEntityId } from "../../../components/explorer/explorerModel";
import { ComputedProperty } from "../../../components/properties/boundProperty";
import { useWatchedValue } from "../../../contexts/watcherContext";
import { type ISelectionService } from "../../../services/selectionService";
import { GetSceneContexts } from "../../sceneEntityUtils";
import { GetBoneDisplayName, GetBoneIndex, GetBoneSkeleton, GetSkeletonDisplayName, GetSkeletonMeshes, GetSkeletonScene } from "../../skeletonUtils";

type NavigationProps = {
    /** The inspected engine. */
    engine: EngineContext;
    /** The service used to navigate to linked entities. */
    selectionService: ISelectionService;
};

const GetBoneCount = (skeleton: Skeleton) => skeleton.bones.length;
const GetMeshName = (mesh: Mesh) => mesh.name || "Unnamed Mesh";

/**
 * Renders a skeleton's read-only bone count.
 * @param props The public skeleton.
 * @returns A watched bone-count line.
 */
export const SkeletonGeneralProperties: FunctionComponent<{ skeleton: Skeleton }> = (props) => {
    const { skeleton } = props;
    return <ComputedProperty component={StringifiedPropertyLine} label="Bone Count" target={skeleton} getValue={GetBoneCount} />;
};

const MeshLink: FunctionComponent<{ mesh: Mesh; selectionService: ISelectionService }> = (props) => {
    const { mesh, selectionService } = props;
    const name = useWatchedValue(mesh, GetMeshName);
    return (
        <PropertyLine label="Mesh" uniqueId={`SkeletonMesh-${GetEntityId(mesh)}`}>
            <Link value={name} onLink={() => (selectionService.selectedEntity = mesh)} />
        </PropertyLine>
    );
};

/**
 * Lists registered scene meshes sharing a skeleton.
 * @param props The engine, skeleton and selection service.
 * @returns Live links to the skeleton's meshes.
 */
export const SkeletonMeshProperties: FunctionComponent<NavigationProps & { skeleton: Skeleton }> = (props) => {
    const { engine, skeleton, selectionService } = props;
    const getMeshes = useCallback(() => [...new Set(GetSceneContexts(engine).flatMap((scene) => GetSkeletonMeshes(scene, skeleton)))], [engine, skeleton]);
    const getMeshIds = useCallback(() => getMeshes().map(GetEntityId).join(","), [getMeshes]);
    useWatchedValue(skeleton, getMeshIds);
    return (
        <>
            {" "}
            {getMeshes().map((mesh) => (
                <MeshLink key={GetEntityId(mesh)} mesh={mesh} selectionService={selectionService} />
            ))}
        </>
    );
};

/**
 * Renders navigation to a public skeleton, without assuming it has a name.
 * @param props The engine, skeleton and selection service.
 * @returns A watched skeleton link.
 */
export const SkeletonLink: FunctionComponent<NavigationProps & { skeleton: Skeleton }> = (props) => {
    const { engine, skeleton, selectionService } = props;
    const getName = useCallback(() => {
        const scene = GetSkeletonScene(engine, skeleton);
        return scene ? GetSkeletonDisplayName(scene, skeleton) : "None";
    }, [engine, skeleton]);
    const name = useWatchedValue(skeleton, getName);
    return (
        <PropertyLine label="Skeleton">
            <Link value={name} onLink={() => (selectionService.selectedEntity = skeleton)} />
        </PropertyLine>
    );
};

/**
 * Renders a bone's immutable identity and hierarchy links.
 * @param props The engine, bone and selection service.
 * @returns Read-only identity lines and hierarchy links.
 */
export const BoneGeneralProperties: FunctionComponent<NavigationProps & { bone: Bone }> = (props) => {
    const { engine, bone, selectionService } = props;
    const skeleton = GetBoneSkeleton(engine, bone);
    if (!skeleton) {
        return null;
    }
    return (
        <>
            <TextPropertyLine label="Name" value={bone.name} />
            <StringifiedPropertyLine label="Index" value={GetBoneIndex(skeleton, bone)} />
            <SkeletonLink engine={engine} skeleton={skeleton} selectionService={selectionService} />
            {bone.parent ? (
                <PropertyLine label="Parent">
                    <Link value={GetBoneDisplayName(skeleton, bone.parent)} onLink={() => (selectionService.selectedEntity = bone.parent)} />
                </PropertyLine>
            ) : (
                <TextPropertyLine label="Parent" value="None" />
            )}
        </>
    );
};

/**
 * Renders the selected mesh's public skeleton link.
 * @param props The engine, mesh and selection service.
 * @returns A skeleton link when bone control exposes a skeleton.
 */
export const MeshSkinningProperties: FunctionComponent<NavigationProps & { mesh: Mesh }> = (props) => {
    const { engine, mesh, selectionService } = props;
    const skeleton = useWatchedValue(mesh, getMeshSkeleton);
    return skeleton ? <SkeletonLink engine={engine} skeleton={skeleton} selectionService={selectionService} /> : null;
};
