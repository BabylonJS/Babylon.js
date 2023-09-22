import { type AccessibilityEntity, getAccessibleItemFromNode, getDescriptionFromNode } from "./htmlTwinItem";

export function HTMLTwinAccessibilityLeaf(props: { node: AccessibilityEntity }) {
    const description = getDescriptionFromNode(props.node);
    const descriptionItem = getAccessibleItemFromNode(props.node);
    // console.log("leaf", props.node.name, "description", description);
    return <>{description ? descriptionItem : null}</>;
}
