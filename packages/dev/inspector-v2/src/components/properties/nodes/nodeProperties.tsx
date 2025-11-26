import type { Node } from "core/index";

import type { FunctionComponent } from "react";

import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import type { ISelectionService } from "../../../services/selectionService";
import { LinkToEntityPropertyLine } from "../linkToEntityPropertyLine";
import { BoundProperty } from "../boundProperty";

export const NodeGeneralProperties: FunctionComponent<{ node: Node; selectionService: ISelectionService }> = (props) => {
    const { node, selectionService } = props;

    const parent = useProperty(node, "parent");
    const isEnabled = useObservableState(() => node.isEnabled(false), node.onEnabledStateChangedObservable);

    return (
        <>
            <LinkToEntityPropertyLine label="Parent" description="The parent of this node" entity={parent} selectionService={selectionService} />
            <SwitchPropertyLine label="Is Enabled" description="Whether the node is enabled or not." value={isEnabled} onChange={(checked) => node.setEnabled(checked)} />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Inherit Visibility"
                description="Whether the node inherits visibility from its parent."
                target={node}
                propertyKey="inheritVisibility"
            />
            <BoundProperty component={SwitchPropertyLine} label="Is Visible" description="Whether the node is visible or not." target={node} propertyKey="isVisible" />
        </>
    );
};
