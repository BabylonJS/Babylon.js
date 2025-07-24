import type { Node } from "core/index";

import type { FunctionComponent } from "react";

import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";

export const NodeGeneralProperties: FunctionComponent<{ node: Node; setSelectedEntity: (entity: unknown) => void }> = (props) => {
    const { node, setSelectedEntity } = props;

    const parent = useProperty(node, "parent");

    return <>{parent && <LinkPropertyLine key="Parent" label="Parent" description={`The parent of this node.`} value={parent.name} onLink={() => setSelectedEntity(parent)} />}</>;
};
