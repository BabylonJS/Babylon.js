import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../../services/sceneContext";
import type { IShellService } from "../../services/shellService";
import { Accordion as BabylonAccordion, AccordionSection as BabylonAccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { ShellServiceIdentity } from "../../services/shellService";

import { CollectionsAdd20Regular } from "@fluentui/react-icons";
import { SceneContextIdentity } from "../../services/sceneContext";
import { useObservableState } from "../../hooks/observableHooks";

// Side-effect import needed for GPUParticleSystem
import "core/Particles/webgl2ParticleSystem";
import { MeshesContent } from "./meshes";
import { MaterialsContent } from "./materials";
import { LightsContent } from "./lights";
import { CamerasContent } from "./cameras";
import { ParticlesContent } from "./particles";
import { RenderingPipelinesContent } from "./renderingPipelines";
import { FrameGraphsContent } from "./frameGraphs";
import { SpriteManagersContent } from "./spriteManagers";

// TODO: This is just a placeholder for a dynamically installed extension that brings in asset creation tools (node materials, etc.).
export const CreateToolsServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext]> = {
    friendlyName: "Creation Tools",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
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
                                    <MeshesContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Materials">
                                    <MaterialsContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Lights">
                                    <LightsContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Particles">
                                    <ParticlesContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Cameras">
                                    <CamerasContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Rendering Pipelines">
                                    <RenderingPipelinesContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Frame Graphs">
                                    <FrameGraphsContent scene={scene} />
                                </BabylonAccordionSection>
                                <BabylonAccordionSection title="Sprite Managers">
                                    <SpriteManagersContent scene={scene} />
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
