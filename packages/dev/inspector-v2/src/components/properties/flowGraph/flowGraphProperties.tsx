import { type FlowGraph } from "core/index";

import { type FunctionComponent } from "react";

import { EditRegular } from "@fluentui/react-icons";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { EditFlowGraph } from "../../../misc/flowGraphEditor";

export const FlowGraphGeneralProperties: FunctionComponent<{ flowGraph: FlowGraph }> = (props) => {
    const { flowGraph } = props;

    return (
        <>
            <ButtonLine label="Edit Graph" icon={EditRegular} onClick={async () => await EditFlowGraph(flowGraph)} />
        </>
    );
};
