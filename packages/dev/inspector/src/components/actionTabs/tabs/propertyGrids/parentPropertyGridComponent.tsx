import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../globalState";
import type { Node } from "core/node";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import type { TransformNode } from "core/Meshes/transformNode";

interface IParentPropertyGridComponentProps {
    globalState: GlobalState;
    lockObject: LockObject;
    node: Node;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class ParentPropertyGridComponent extends React.Component<IParentPropertyGridComponentProps> {
    constructor(props: IParentPropertyGridComponentProps) {
        super(props);
    }

    private _getNameForSorting(node: any) {
        const isNameAString = node.name && typeof node.name === "string";
        return isNameAString ? node.name : "no name";
    }

    render() {
        const node = this.props.node;
        const scene = node.getScene();

        const sortedNodes = scene
            .getNodes()
            .filter((n) => n !== node)
            .map((n) => this._getNameForSorting).
            .sort((a, b) => {
                return aName.localeCompare(bName);
            });

        const nodeOptions = sortedNodes.map((m, i) => {
            return {
                label: m.name || "no name",
                value: i,
            };
        });

        nodeOptions.splice(0, 0, { label: "None", value: -1 });

        return (
            <>
                {node.parent && (
                    <TextLineComponent
                        label="Link to parent"
                        value={node.parent.name}
                        onLink={() => this.props.globalState.onSelectionChangedObservable.notifyObservers(node.parent)}
                    />
                )}
                <OptionsLineComponent
                    label="Parent"
                    options={nodeOptions}
                    target={node}
                    propertyName="parent"
                    noDirectUpdate={true}
                    onSelect={(value) => {
                        const nodeAsTransform = node as TransformNode;
                        if (typeof value === "number" && value < 0) {
                            if (nodeAsTransform.setParent) {
                                nodeAsTransform.setParent(null);
                            } else {
                                node.parent = null;
                            }
                        } else {
                            const newParent = sortedNodes[value as number];
                            if (nodeAsTransform.setParent) {
                                nodeAsTransform.setParent(newParent);
                            } else {
                                node.parent = newParent;
                            }
                        }

                        this.props.globalState.onSelectionRenamedObservable.notifyObservers();
                    }}
                    extractValue={() => (node.parent ? sortedNodes.indexOf(node.parent) : -1)}
                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                />
            </>
        );
    }
}
