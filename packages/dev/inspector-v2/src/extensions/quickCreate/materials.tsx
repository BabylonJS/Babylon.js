import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Scene } from "core/scene";
import { useState } from "react";
import type { FunctionComponent } from "react";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { QuickCreateSection, QuickCreateItem } from "./quickCreateLayout";
import type { ISelectionService } from "../../services/selectionService";

type MaterialsContentProps = {
    scene: Scene;
    selectionService: ISelectionService;
};

/**
 * Materials content component
 * @param props - Component props
 * @returns React component
 */
export const MaterialsContent: FunctionComponent<MaterialsContentProps> = ({ scene, selectionService }) => {
    // Node Material state
    const [nodeMaterialName, setNodeMaterialName] = useState("Node Material");
    const [nodeMaterialSnippetId, setNodeMaterialSnippetId] = useState("");

    // PBR Material state
    const [pbrMaterialName, setPbrMaterialName] = useState("PBR Material");

    // Standard Material state
    const [standardMaterialName, setStandardMaterialName] = useState("Standard Material");

    const createPBRMaterial = () => {
        return new PBRMaterial(pbrMaterialName, scene);
    };

    const createStandardMaterial = () => {
        return new StandardMaterial(standardMaterialName, scene);
    };

    const handleCreateNodeMaterialAsync = async () => {
        if (nodeMaterialSnippetId) {
            const nodeMaterial = await NodeMaterial.ParseFromSnippetAsync(nodeMaterialSnippetId, scene);
            nodeMaterial.name = nodeMaterialName;
            return nodeMaterial;
        } else {
            const nodeMaterial = new NodeMaterial(nodeMaterialName, scene);
            nodeMaterial.setToDefault();
            nodeMaterial.build();
            return nodeMaterial;
        }
    };

    return (
        <QuickCreateSection>
            {/* Node Material */}
            <QuickCreateItem selectionService={selectionService} label="Node Material" onCreate={handleCreateNodeMaterialAsync}>
                <TextInputPropertyLine label="Name" value={nodeMaterialName} onChange={(value) => setNodeMaterialName(value)} />
                <TextInputPropertyLine label="Snippet ID" value={nodeMaterialSnippetId} onChange={(value) => setNodeMaterialSnippetId(value)} />
            </QuickCreateItem>

            {/* PBR Material */}
            <QuickCreateItem selectionService={selectionService} label="PBR Material" onCreate={() => createPBRMaterial()}>
                <TextInputPropertyLine label="Name" value={pbrMaterialName} onChange={(value) => setPbrMaterialName(value)} />
            </QuickCreateItem>

            {/* Standard Material */}
            <QuickCreateItem selectionService={selectionService} label="Standard Material" onCreate={() => createStandardMaterial()}>
                <TextInputPropertyLine label="Name" value={standardMaterialName} onChange={(value) => setStandardMaterialName(value)} />
            </QuickCreateItem>
        </QuickCreateSection>
    );
};
