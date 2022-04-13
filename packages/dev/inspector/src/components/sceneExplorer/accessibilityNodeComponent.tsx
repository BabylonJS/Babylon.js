import { Mesh, Node } from "babylonjs";
import * as React from "react";
import { AccessibilityNode, ActionType } from "./accessibilityNode";

interface IAccessibilityNodeComponentProps {
    a11yNode: AccessibilityNode;
}

export class AccessibilityTreeNodeComponent extends React.Component<IAccessibilityNodeComponentProps> {
    constructor(props: IAccessibilityNodeComponentProps) {
        super(props);
    }

    render() {
        const a11yNode = this.props.a11yNode;

        //TODO: remove this debug code
        console.log(a11yNode.node._getActionManagerForTrigger());
        console.log(a11yNode.node._getActionManagerForTrigger(2));
        console.log(a11yNode.node._getActionManagerForTrigger(8));

        if (a11yNode.children.length === 0) {
            return this._renderLeafNode(a11yNode);
        }
        else {
            return this._renderParentNode(a11yNode);
        }
    }

    private _renderLeafNode(a11yNode: AccessibilityNode): JSX.Element {
        const node = a11yNode.node;
        if(a11yNode.isActionable) {
            return (
                <button
                    onClick={a11yNode.getActionHandler(ActionType.OnClick)}
                    onContextMenu={a11yNode.getActionHandler(ActionType.OnRightClick)}
                    tabIndex={0}
                    onFocus={() => {this._onFocus(node);}}
                    onBlur={() => {this._onBlur(node);}}
                >
                    {node.accessibilityTag.description}
                </button>
            );
        }
        else {
            return (
                <div
                    tabIndex={0}
                    onFocus={() => {this._onFocus(node);}}
                    onBlur={() => {this._onBlur(node);}}
                >
                    {node.accessibilityTag.description}
                </div>
            );
        }
    }

    private _renderParentNode(a11yNode: AccessibilityNode): JSX.Element {
        return (
            <div>
                <div role={'heading'} aria-level={a11yNode.level}
                    tabIndex={0}
                    onFocus={() => {this._onFocus(a11yNode.node);}}
                    onBlur={() => {this._onBlur(a11yNode.node);}}
                >
                    {a11yNode.node.accessibilityTag.description}
                </div>
                {this._renderChildren(a11yNode.children)}
            </div>
        );
    }

    private _renderChildren(children: AccessibilityNode[]): JSX.Element[] {
        return (
            children.map((child) => {
                return <AccessibilityTreeNodeComponent
                    a11yNode={child}
                    key={child.node.uniqueId !== undefined && child.node.uniqueId !== null ? child.node.uniqueId : child.node.name}
                    />
            })
        );
    }

    private _onFocus(node: Node): void {
        console.log(`Focused on ${node.name}`);
        console.log(node);
        this._highlightNode(node, false); // why 'false': focusing on an node will focus on its focusable parent too. Do not apply hightlight on children to avoid the whole group highlighted when a member is highlighted.
    }

    private _onBlur(node: Node): void {
        console.log(`Left focus on ${node.name}`);
        this._dishighlightNode(node, false);
    }

    private _highlightNode(node: Node, applyOnChildren: boolean): void {
        if (node.getClassName().indexOf('Mesh') !== -1) {
            const mesh = node as Mesh;
            mesh.enableEdgesRendering(0.999);
            mesh.edgesWidth = 5;
            mesh.edgesColor = new BABYLON.Color4(0.25, 0.5, 1, 1);
        }
        if (applyOnChildren) {
            const children = node.getChildren();
            if (children.length >= 0) {
                children.map((child) => {this._highlightNode(child, true)});
            }
        }
    }

    private _dishighlightNode(node: Node, applyOnChildren: boolean): void {
        if (node.getClassName().indexOf('Mesh') !== -1) {
            const mesh = node as Mesh;
            mesh.disableEdgesRendering();
        }
        if (applyOnChildren) {
            const children = node.getChildren();
            if (children.length >= 0) {
                children.map((child) => {this._dishighlightNode(child, true)});
            }
        }
    }
}
