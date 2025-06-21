// eslint-disable-next-line import/no-internal-modules
import type { Node } from "core/index";

import type { FunctionComponent } from "react";

import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/linkPropertyLine";

import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";

export const NodeGeneralProperties: FunctionComponent<{ node: Node; setSelectedEntity: (entity: unknown) => void }> = (props) => {
    const { node, setSelectedEntity } = props;

    const parent = useObservableState(() => node.parent, useInterceptObservable("property", node, "parent"));

    return <>{parent && <LinkPropertyLine key="Parent" label="Parent" description={`The parent of this node.`} value={parent.name} onLink={() => setSelectedEntity(parent)} />}</>;
};
