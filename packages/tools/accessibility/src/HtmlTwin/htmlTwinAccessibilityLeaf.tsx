import { type AccessibilityEntity, getAccessibleItemFromNode, getDescriptionFromNode } from "./htmlTwinItem";

export function HTMLTwinAccessibilityLeaf(props: { node: AccessibilityEntity }) {
    const descriptionItem = getAccessibleItemFromNode(props.node);
    // console.log("leaf", props.node.name, "description", description);
    return descriptionItem;
}
