import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { makeStyles, tokens } from "@fluentui/react-components";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SettingsPopover } from "./settingsPopover";

// eslint-disable-next-line @typescript-eslint/naming-convention
const useStyles = makeStyles({
    section: {
        display: "flex",
        flexDirection: "column",
        rowGap: tokens.spacingVerticalM,
    },
    row: { display: "flex", alignItems: "center", gap: "4px" },
});

type MaterialsContentProps = {
    scene: Scene;
};

/**
 * Materials content component
 * @param props - Component props
 * @returns React component
 */
export const MaterialsContent: FunctionComponent<MaterialsContentProps> = ({ scene }) => {
    const classes = useStyles();

    // Node Material state
    const [nodeMaterialName, setNodeMaterialName] = useState("Node Material");
    const [nodeMaterialSnippetId, setNodeMaterialSnippetId] = useState("");

    // PBR Material state
    const [pbrMaterialName, setPbrMaterialName] = useState("PBR Material");

    // Standard Material state
    const [standardMaterialName, setStandardMaterialName] = useState("Standard Material");

    const handleCreateNodeMaterialAsync = async () => {
        if (nodeMaterialSnippetId) {
            try {
                const nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(nodeMaterialSnippetId, scene);
                nodeMaterial.name = nodeMaterialName;
            } catch (e) {
                alert("Failed to load Node Material from snippet: " + e);
            }
        } else {
            const nodeMaterial = new NodeMaterial(nodeMaterialName, scene);
            nodeMaterial.build();
        }
    };

    const handleCreatePBRMaterial = () => {
        new PBRMaterial(pbrMaterialName, scene);
    };

    const handleCreateStandardMaterial = () => {
        new StandardMaterial(standardMaterialName, scene);
    };

    return (
        <div className={classes.section}>
            {/* Node Material */}
            <div className={classes.row}>
                <Button onClick={handleCreateNodeMaterialAsync} label="Node Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={nodeMaterialName} onChange={(value) => setNodeMaterialName(value)} />
                    <TextInputPropertyLine label="Snippet ID" value={nodeMaterialSnippetId} onChange={(value) => setNodeMaterialSnippetId(value)} />
                    <Button appearance="primary" onClick={handleCreateNodeMaterialAsync} label="Create" />
                </SettingsPopover>
            </div>

            {/* PBR Material */}
            <div className={classes.row}>
                <Button onClick={handleCreatePBRMaterial} label="PBR Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={pbrMaterialName} onChange={(value) => setPbrMaterialName(value)} />
                    <Button appearance="primary" onClick={handleCreatePBRMaterial} label="Create" />
                </SettingsPopover>
            </div>

            {/* Standard Material */}
            <div className={classes.row}>
                <Button onClick={handleCreateStandardMaterial} label="Standard Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={standardMaterialName} onChange={(value) => setStandardMaterialName(value)} />
                    <Button appearance="primary" onClick={handleCreateStandardMaterial} label="Create" />
                </SettingsPopover>
            </div>
        </div>
    );
};
