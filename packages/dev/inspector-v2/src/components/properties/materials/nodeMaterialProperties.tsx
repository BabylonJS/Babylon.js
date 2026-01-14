import type { FunctionComponent } from "react";

import type { NodeMaterial } from "core/index";

import { EditRegular } from "@fluentui/react-icons";

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
                icon={EditRegular}
                onClick={async () => {
                    // TODO: Figure out how to get all the various build steps to work with this.
                    //       See the initial attempt here: https://github.com/BabylonJS/Babylon.js/pull/17646
                    // const { NodeEditor } = await import("node-editor/nodeEditor");
                    // NodeEditor.Show({ nodeMaterial: material });
                    await material.edit();
                }}
            ></ButtonLine>
        </>
    );
};
