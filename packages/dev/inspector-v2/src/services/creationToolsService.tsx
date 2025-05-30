import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { ISceneContext } from "./sceneContext";
import type { IShellService } from "./shellService";

import { makeStyles, tokens, Accordion, AccordionItem, AccordionHeader, AccordionPanel, Text, Button } from "@fluentui/react-components";
import { ShellServiceIdentity } from "./shellService";

import { FormNewRegular } from "@fluentui/react-icons";
import { SceneContextIdentity } from "./sceneContext";
import { useObservableState } from "../hooks/observableHooks";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
});

// TODO: This is just a placeholder for a dynamically installed extension that brings in asset creation tools (node materials, etc.).
export const CreationToolsServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext]> = {
    friendlyName: "Creation Tools",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const registration = shellService.addSidePane({
            key: "Create",
            title: "Create",
            icon: FormNewRegular,
            horizontalLocation: "left",
            content: () => {
                const classes = useStyles();

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

                return (
                    <>
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
    serviceDefinitions: [CreationToolsServiceDefinition],
} as const;
