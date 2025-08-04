import type { Node } from "core/index";

import type { FunctionComponent } from "react";

import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

export const NodeGeneralProperties: FunctionComponent<{ node: Node; setSelectedEntity: (entity: unknown) => void }> = (props) => {
    const { node, setSelectedEntity } = props;

    const parent = useProperty(node, "parent");
    const isEnabled = useObservableState(() => node.isEnabled(false), node.onEnabledStateChangedObservable);

    return (
        <>
            {parent && <LinkPropertyLine key="Parent" label="Parent" description={`The parent of this node.`} value={parent.name} onLink={() => setSelectedEntity(parent)} />}
            <SwitchPropertyLine
                key="NodeIsEnabled"
                label="Is Enabled"
                description="Whether the node is enabled or not."
                value={isEnabled}
                onChange={(checked) => node.setEnabled(checked)}
            />
        </>
    );
};
