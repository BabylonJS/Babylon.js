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

export const CreationToolsServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext]> = {
    friendlyName: "Creation Tools",
    consumes: [ShellServiceIdentity, SceneContextIdentity],
    factory: (shellService, sceneContext) => {
        const registration = shellService.addToLeftPane({
            key: "Create",
            title: "Create",
            icon: FormNewRegular,
            content: () => {
                const classes = useStyles();

                const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                // eslint-disable-next-line no-console
                console.log(`Creation tools for ${scene}`);

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
