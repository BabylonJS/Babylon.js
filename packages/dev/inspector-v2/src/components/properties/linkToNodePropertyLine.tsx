import type { PropertyLineProps } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import type { ISelectionService } from "../../services/selectionService";
import { useEffect, useState, type FunctionComponent } from "react";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import type { Nullable } from "core/types";

type LinkToNodeProps = { node: Nullable<{ name: string; reservedDataStore?: Record<PropertyKey, unknown> }>; selectionService: ISelectionService };

/**
 * A property line that links to a specific node in the scene.
 * @param props The properties for the link to node property line.
 * @returns A link property line component.
 */
export const LinkToNodePropertyLine: FunctionComponent<PropertyLineProps<string> & LinkToNodeProps> = (props) => {
    const { selectionService, node, ...rest } = props;
    const [linkedNode, setLinkedNode] = useState(node);
    useEffect(() => {
        setLinkedNode(props.node);
    }, [props.node]);
    return (
        linkedNode && !linkedNode.reservedDataStore?.hidden && <LinkPropertyLine {...rest} value={linkedNode.name} onLink={() => (selectionService.selectedEntity = linkedNode)} />
    );
};
