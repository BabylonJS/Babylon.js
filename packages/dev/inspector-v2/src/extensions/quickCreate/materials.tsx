import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SettingsPopover } from "./settingsPopover";
import { QuickCreateSection, QuickCreateRow } from "./quickCreateLayout";

type MaterialsContentProps = {
    scene: Scene;
};

/**
 * Materials content component
 * @param props - Component props
 * @returns React component
 */
export const MaterialsContent: FunctionComponent<MaterialsContentProps> = ({ scene }) => {
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
            nodeMaterial.setToDefault();
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
        <QuickCreateSection>
            {/* Node Material */}
            <QuickCreateRow>
                <Button onClick={handleCreateNodeMaterialAsync} label="Node Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={nodeMaterialName} onChange={(value) => setNodeMaterialName(value)} />
                    <TextInputPropertyLine label="Snippet ID" value={nodeMaterialSnippetId} onChange={(value) => setNodeMaterialSnippetId(value)} />
                    <Button appearance="primary" onClick={handleCreateNodeMaterialAsync} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* PBR Material */}
            <QuickCreateRow>
                <Button onClick={handleCreatePBRMaterial} label="PBR Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={pbrMaterialName} onChange={(value) => setPbrMaterialName(value)} />
                    <Button appearance="primary" onClick={handleCreatePBRMaterial} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>

            {/* Standard Material */}
            <QuickCreateRow>
                <Button onClick={handleCreateStandardMaterial} label="Standard Material" />
                <SettingsPopover>
                    <TextInputPropertyLine label="Name" value={standardMaterialName} onChange={(value) => setStandardMaterialName(value)} />
                    <Button appearance="primary" onClick={handleCreateStandardMaterial} label="Create" />
                </SettingsPopover>
            </QuickCreateRow>
        </QuickCreateSection>
    );
};
