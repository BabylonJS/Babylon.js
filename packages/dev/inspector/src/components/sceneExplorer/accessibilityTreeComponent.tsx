import * as React from "react";
import { Scene } from "babylonjs/scene";
import { Node } from "babylonjs";
import { AccessibilityTreeItemComponent } from "./accessibilityTreeItemComponent";
import { AccessibilityItem } from "./accessibilityItem";

interface IAccessibilityTreeComponentProps {
    scene: Scene;
}

export class AccessibilityTreeComponent extends React.Component<IAccessibilityTreeComponentProps> {
    constructor(props: IAccessibilityTreeComponentProps) {
        super(props);
    }

    render() {
        // Nodes
        const rootNodes = this.props.scene.rootNodes.slice(0);

        for (const mesh of this.props.scene.meshes) { // Adding nodes that are parented to a bone
            if (mesh.parent && mesh.parent.getClassName() === "Bone") {
                rootNodes.push(mesh);
            }
        }

        // Get accessibility tree's root nodes
        const a11yTreeRootNodes = this._getAccessibilityTreeRootNodes(rootNodes, 2);

        return (
            <div className="accessibility-tree">
                {a11yTreeRootNodes.map((item) => {
                    return (
                        <AccessibilityTreeItemComponent
                            a11yNode={item}
                            key={item.node.uniqueId !== undefined && item.node.uniqueId !== null ? item.node.uniqueId : item.node.name}
                        />
                    );
                })}
            </div>
        );
    }

    private _getAccessibilityTreeRootNodes(rootNodes: Node[], level: number): AccessibilityItem[] {
        if (!rootNodes || rootNodes.length === 0) {
            return [];
        }

        let result: AccessibilityItem[] = [];
        let queue: Node[] = [...rootNodes];
        for (let i: number = 0; i < queue.length; i++) {
            const curNode = queue[i];
            if (curNode.accessibilityTag?.isSalient) {
                result.push(new AccessibilityItem(curNode, this._getAccessibilityTreeRootNodes(curNode.getChildren(), Math.min(level + 1, 6)), level));
            }
            else {
                queue.push(...curNode.getChildren());
            }
        }

        return result;
    }
}