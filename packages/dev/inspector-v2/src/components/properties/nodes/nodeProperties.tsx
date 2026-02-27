import type { FunctionComponent } from "react";

import type { Node } from "core/index";
import type { ISelectionService } from "../../../services/selectionService";

import { NodeSelectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/entitySelectorPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty, Property } from "../boundProperty";

export const NodeGeneralProperties: FunctionComponent<{ node: Node; selectionService: ISelectionService }> = (props) => {
    const { node, selectionService } = props;

    const isEnabled = useObservableState(() => node.isEnabled(false), node.onEnabledStateChangedObservable);

    return (
        <>
            <BoundProperty
                component={NodeSelectorPropertyLine}
                label="Parent"
                target={node}
                propertyKey="parent"
                scene={node.getScene()}
                defaultValue={null}
                onLink={(parentNode) => (selectionService.selectedEntity = parentNode)}
            />
            <Property
                component={SwitchPropertyLine}
                label="Is Enabled"
                description="Whether the node is enabled or not."
                value={isEnabled}
                onChange={(checked) => node.setEnabled(checked)}
                functionPath="setEnabled"
            />
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
