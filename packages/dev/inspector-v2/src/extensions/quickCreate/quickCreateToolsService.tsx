import type { ServiceDefinition } from "../../modularity/serviceDefinition";
import type { ISceneContext } from "../../services/sceneContext";
import type { IShellService } from "../../services/shellService";
import { Accordion as BabylonAccordion, AccordionSection as BabylonAccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { makeStyles, tokens } from "@fluentui/react-components";
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

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    scrollArea: {
        flex: 1,
        overflowY: "auto",
        paddingRight: tokens.spacingHorizontalS,
        paddingBottom: tokens.spacingVerticalS,
    },
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
});

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
                const classes = useStyles();

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                // eslint-disable-next-line no-console
                console.log(scene);

                return (
                    <div className={classes.container}>
                        <div className={classes.scrollArea}>
                            {/* <BabylonAccordion multiple> */}
                            <BabylonAccordion>
                                <BabylonAccordionSection title="Meshes">{scene && <MeshesContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Materials">{scene && <MaterialsContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Lights">{scene && <LightsContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Particles">{scene && <ParticlesContent scene={scene} />}</BabylonAccordionSection>
                                <BabylonAccordionSection title="Cameras">{scene && <CamerasContent scene={scene} />}</BabylonAccordionSection>
                            </BabylonAccordion>
                        </div>
                    </div>
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
