import { getDirectChildrenOf, type AccessibilityEntity, getAccessibleItemFromNode, getDescriptionFromNode } from "./htmlTwinItem";
import { HTMLTwinAccessibilityAdaptor } from "./htmlTwinNodeAdapter";

export function HTMLTwinAccessibilityNode(props: { node: AccessibilityEntity }) {
    const nodeChildren = getDirectChildrenOf(props.node);
    // const description = getDescriptionFromNode(props.node);
    // console.log("description for node", props.node.name, description);
    const accessibleItem = getAccessibleItemFromNode(props.node);
    return (
        <div>
            {accessibleItem}
            {nodeChildren.map((child: AccessibilityEntity) => (
                <HTMLTwinAccessibilityAdaptor key={child.name} node={child} />
            ))}
        </div>
    );
}
