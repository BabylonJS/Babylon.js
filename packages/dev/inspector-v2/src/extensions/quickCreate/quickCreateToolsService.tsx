import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../../services/sceneContext";
import type { ISelectionService } from "../../services/selectionService";
import type { IShellService } from "../../services/shellService";
import { Accordion as BabylonAccordion, AccordionSection as BabylonAccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { ShellServiceIdentity } from "../../services/shellService";

import { CollectionsAdd20Regular } from "@fluentui/react-icons";
import { SceneContextIdentity } from "../../services/sceneContext";
import { SelectionServiceIdentity } from "../../services/selectionService";
import { useObservableState } from "../../hooks/observableHooks";

// Side-effect import needed for GPUParticleSystem
import "core/Particles/webgl2ParticleSystem";
// Side-effect import needed for enablePrePassRenderer (used by SSAO2, SSR, etc.)
import "core/Rendering/prePassRendererSceneComponent";
import { MeshesContent } from "./meshes";
import { MaterialsContent } from "./materials";
import { LightsContent } from "./lights";
import { CamerasContent } from "./cameras";
import { ParticlesContent } from "./particles";
import { RenderingPipelinesContent } from "./renderingPipelines";
import { FrameGraphsContent } from "./frameGraphs";
import { SpriteManagersContent } from "./spriteManagers";

// TODO: This is just a placeholder for a dynamically installed extension that brings in asset creation tools (node materials, etc.).
export const CreateToolsServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext, ISelectionService]> = {
    friendlyName: "Creation Tools",
    consumes: [ShellServiceIdentity, SceneContextIdentity, SelectionServiceIdentity],
    factory: (shellService, sceneContext, selectionService) => {
        const registration = shellService.addSidePane({
            key: "Create",
            title: "Creation Tools",
            icon: CollectionsAdd20Regular,
            horizontalLocation: "left",
            verticalLocation: "top",
            content: () => {
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                return (
                    scene && (
                        <>
                            <BabylonAccordion>
                                <BabylonAccordionSection title="Meshes">
                                    <MeshesContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Materials">
                                    <MaterialsContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Lights">
                                    <LightsContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Particles">
                                    <ParticlesContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Cameras">
                                    <CamerasContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Rendering Pipelines">
                                    <RenderingPipelinesContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Frame Graphs">
                                    <FrameGraphsContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Sprite Managers">
                                    <SpriteManagersContent scene={scene} selectionService={selectionService} />
                                </BabylonAccordionSection>
                            </BabylonAccordion>
                        </>
                    )
                );
            },
        });
        return {
            dispose: () => registration.dispose(),
        };
    },
};

export default {
    serviceDefinitions: [CreateToolsServiceDefinition],
} as const;
