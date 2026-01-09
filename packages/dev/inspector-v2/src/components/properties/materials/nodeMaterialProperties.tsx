import type { FunctionComponent } from "react";

import type { NodeMaterial } from "core/index";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { BoundProperty } from "../boundProperty";

export const NodeMaterialGeneralProperties: FunctionComponent<{ material: NodeMaterial }> = (props) => {
    const { material } = props;

    return (
        <>
            <BoundProperty component={SwitchPropertyLine} label="Ignore Alpha" target={material} propertyKey="ignoreAlpha" />
            <ButtonLine
                label="Edit"
                onClick={async () => {
                    const { NodeEditor } = await import("node-editor/nodeEditor");
                    NodeEditor.Show({ nodeMaterial: material });
                }}
            ></ButtonLine>
        </>
    );
};
