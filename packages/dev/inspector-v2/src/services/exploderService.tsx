//import type { Nullable } from "core/index";
import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { Slider, makeStyles, shorthands, tokens, Accordion, AccordionItem, AccordionHeader, AccordionPanel, Text, Button } from "@fluentui/react-components";
import { ShellService } from "./shellService";

import { FormNewRegular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { Mesh } from "core/Meshes/mesh";
import { MeshExploder } from "core/Misc/meshExploder";
import { SceneContext } from "./sceneContext";
import { useObservableState } from "../hooks/observableHooks";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
    },
    slider: {
        ...shorthands.margin(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    },
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
});

const explodeMax = 3;
const explodeMultiplier = 100 / explodeMax;

export const serviceDefinition: ServiceDefinition<[], [ShellService, SceneContext]> = {
    friendlyName: "Explode a Model",
    tags: ["scene"],
    consumes: [ShellService, SceneContext],
    factory: (shellService, sceneContext) => {
        const registration = shellService.addToLeftPane({
            key: "Create",
            title: "Create",
            icon: FormNewRegular,
            content: () => {
                const classes = useStyles();

                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                const [exploder, setExploder] = useState<MeshExploder>();
                const [explode, setExplode] = useState(0);

                useEffect(() => {
                    if (scene) {
                        const meshes = scene.meshes.filter((mesh): mesh is Mesh => mesh instanceof Mesh);
                        setExploder(new MeshExploder(meshes));
                    } else {
                        setExploder(undefined);
                    }
                }, [scene]);

                useEffect(() => {
                    exploder?.explode(explode);
                }, [explode, exploder]);

                return (
                    <>
                        {false && (
                            <div className={classes.container}>
                                <Slider
                                    className={classes.slider}
                                    value={explode * explodeMultiplier}
                                    max={100}
                                    disabled={!scene}
                                    onChange={(event, data) => setExplode(data.value / explodeMultiplier)}
                                />
                            </div>
                        )}
                        <Accordion collapsible multiple defaultOpenItems={["Materials", "Interactivity"]}>
                            <AccordionItem key="Materials" value="Materials">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>Materials</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.section}>
                                        <Button>PBR Material</Button>
                                        <Button>Node Material</Button>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                            <AccordionItem key="Interactivity" value="Interactivity">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>Interactivity</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.section}>
                                        <Button>Flow Graph</Button>
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                    </>
                );
            },
        });

        return {
            dispose: () => registration.dispose(),
        };
    },
};

export default {
    serviceDefinitions: [serviceDefinition] as const,
} as const;
