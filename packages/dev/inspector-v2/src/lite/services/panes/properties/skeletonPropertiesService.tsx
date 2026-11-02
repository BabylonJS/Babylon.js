import { getMeshSkeleton, type Bone, type Mesh, type Skeleton } from "@babylonjs/lite";

import { MakeLazyComponent } from "shared-ui-components/fluent/primitives/lazyComponent";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IPropertiesService, PropertiesServiceIdentity } from "../../../../services/panes/properties/propertiesService";
import { type ISelectionService, SelectionServiceIdentity } from "../../../../services/selectionService";
import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { GetMeshMorphTargets } from "../../../morphTargetUtils";
import { GetSceneContexts, IsMesh } from "../../../sceneEntityUtils";
import { GetSkeletonSceneMeshes, IsBone, IsSkeleton } from "../../../skeletonUtils";

const SkeletonGeneralProperties = MakeLazyComponent(async () => (await import("../../../components/properties/skeletonProperties")).SkeletonGeneralProperties);
const SkeletonMeshProperties = MakeLazyComponent(async () => (await import("../../../components/properties/skeletonProperties")).SkeletonMeshProperties);
const BoneGeneralProperties = MakeLazyComponent(async () => (await import("../../../components/properties/skeletonProperties")).BoneGeneralProperties);
const MeshSkinningProperties = MakeLazyComponent(async () => (await import("../../../components/properties/skeletonProperties")).MeshSkinningProperties);
const MeshMorphTargetProperties = MakeLazyComponent(async () => (await import("../../../components/properties/morphTargetProperties")).MeshMorphTargetProperties);

/** Registers lazy read-only skeleton/bone navigation and mesh skinning/morph sections. */
export const SkeletonPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService, IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Skeleton and Morph Properties",
    consumes: [PropertiesServiceIdentity, EngineContextIdentity, SelectionServiceIdentity],
    factory: (propertiesService, engineContext, selectionService) => {
        const engine = engineContext.engine;
        const getMeshScene = (mesh: Mesh) => GetSceneContexts(engine).find((scene) => GetSkeletonSceneMeshes(scene).includes(mesh));
        const registrations = [
            propertiesService.addSectionContent({
                key: "Babylon Lite Skeleton Properties",
                predicate: (entity): entity is Skeleton => IsSkeleton(engine, entity),
                content: [
                    { section: "General", component: ({ context }) => <SkeletonGeneralProperties skeleton={context} /> },
                    { section: "Meshes", component: ({ context }) => <SkeletonMeshProperties engine={engine} skeleton={context} selectionService={selectionService} /> },
                ],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Bone Properties",
                predicate: (entity): entity is Bone => IsBone(engine, entity),
                content: [{ section: "General", component: ({ context }) => <BoneGeneralProperties engine={engine} bone={context} selectionService={selectionService} /> }],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Mesh Skinning Properties",
                predicate: (entity): entity is Mesh => IsMesh(entity) && !!getMeshScene(entity) && !!getMeshSkeleton(entity),
                content: [{ section: "Skinning", component: ({ context }) => <MeshSkinningProperties engine={engine} mesh={context} selectionService={selectionService} /> }],
            }),
            propertiesService.addSectionContent({
                key: "Babylon Lite Mesh Morph Target Properties",
                predicate: (entity): entity is Mesh => IsMesh(entity) && !!getMeshScene(entity) && !!GetMeshMorphTargets(entity),
                content: [
                    {
                        section: "Morph Targets",
                        component: ({ context }) => {
                            const scene = getMeshScene(context);
                            return scene ? <MeshMorphTargetProperties scene={scene} mesh={context} /> : null;
                        },
                    },
                ],
            }),
        ];
        return { dispose: () => registrations.forEach((registration) => registration.dispose()) };
    },
};
