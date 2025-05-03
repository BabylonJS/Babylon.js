import type { ServiceDefinition } from "../../modularity/serviceDefinition";

import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, makeStyles, Text, tokens } from "@fluentui/react-components";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { BooleanProperty } from "../../components/booleanProperty";
import { PropertiesService } from "./propertiesService";

const useStyles = makeStyles({
    rootDiv: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    accordion: {
        overflowY: "auto",
        paddingBottom: tokens.spacingVerticalM,
    },
    panelDiv: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
        overflow: "hidden",
    },
});

export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [PropertiesService]> = {
    friendlyName: "Mesh Properties",
    tags: ["diagnostics"],
    consumes: [PropertiesService],
    factory: (propertiesService) => {
        const registration = propertiesService.addEntityType(
            (entity) => entity instanceof AbstractMesh,
            ({ entity: mesh }) => {
                mesh.isEnabled;
                const classes = useStyles();

                return (
                    <div className={classes.rootDiv}>
                        <Accordion className={classes.accordion} collapsible multiple defaultOpenItems={["General"]}>
                            <AccordionItem key="General" value="General">
                                <AccordionHeader expandIconPosition="end">
                                    <Text size={500}>General</Text>
                                </AccordionHeader>
                                <AccordionPanel>
                                    <div className={classes.panelDiv}>
                                        <BooleanProperty
                                            label="Is enabled"
                                            description="Determines whether a mesh is enabled within the scene"
                                            accessor={() => mesh.isEnabled(false)}
                                            mutator={(value) => mesh.setEnabled(value)}
                                            observable={mesh.onEnabledStateChangedObservable}
                                        />
                                    </div>
                                </AccordionPanel>
                            </AccordionItem>
                        </Accordion>
                    </div>
                );
            }
        );

        return {
            dispose: () => registration.dispose(),
        };
    },
};
