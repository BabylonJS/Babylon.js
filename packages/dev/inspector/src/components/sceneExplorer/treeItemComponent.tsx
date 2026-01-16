import * as React from "react";

import type { Nullable } from "core/types";
import type { IInspectorContextMenuItem, IExplorerExtensibilityGroup } from "core/Debug/debugLayer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faBan, faExpandArrowsAlt, faCompress } from "@fortawesome/free-solid-svg-icons";
import { TreeItemSelectableComponent } from "./treeItemSelectableComponent";
import { Tools } from "../../tools";
import type { GlobalState } from "../globalState";
import type { ContextMenuItem } from "shared-ui-components/fluent/primitives/contextMenu";
import { ContextMenu } from "shared-ui-components/fluent/primitives/contextMenu";
import { FluentToolWrapper } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import type { Camera } from "core/Cameras/camera";

const ConvertToContextMenuItems = (items?: IInspectorContextMenuItem[]): ContextMenuItem[] => {
    if (!items) {
        return [];
    }
    return items.map((item) => ({
        key: item.label,
        label: item.label,
        onClick: item.action,
    }));
};

interface ITreeItemExpandableHeaderComponentProps {
    isExpanded: boolean;
    label: string;
    onClick: () => void;
    onExpandAll: (expand: boolean) => void;
}

class TreeItemExpandableHeaderComponent extends React.Component<ITreeItemExpandableHeaderComponentProps> {
    constructor(props: ITreeItemExpandableHeaderComponentProps) {
        super(props);
    }

    expandAll() {
        this.props.onExpandAll(!this.props.isExpanded);
    }

    override render() {
        const chevron = this.props.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />;
        const expandAll = this.props.isExpanded ? <FontAwesomeIcon icon={faCompress} /> : <FontAwesomeIcon icon={faExpandArrowsAlt} />;

        return (
            <div className="expandableHeader">
                <div className="text">
                    <div className="arrow icon" onClick={() => this.props.onClick()}>
                        {chevron}
                    </div>
                    <div className="text-value">{this.props.label}</div>
                </div>
                <div className="expandAll icon" onClick={() => this.expandAll()} title={this.props.isExpanded ? "Collapse all" : "Expand all"}>
                    {expandAll}
                </div>
            </div>
        );
    }
}

interface ITreeItemRootHeaderComponentProps {
    label: string;
}

class TreeItemRootHeaderComponent extends React.Component<ITreeItemRootHeaderComponentProps> {
    constructor(props: ITreeItemRootHeaderComponentProps) {
        super(props);
    }

    override render() {
        return (
            <div className="expandableHeader">
                <div className="text">
                    <div className="arrow icon">
                        <FontAwesomeIcon icon={faBan} />
                    </div>
                    <div className="text-value">{this.props.label}</div>
                </div>
            </div>
        );
    }
}

export interface ITreeItemComponentProps {
    items?: Nullable<any[]>;
    label: string;
    offset: number;
    filter: Nullable<string>;
    forceSubitems?: boolean;
    globalState: GlobalState;
    gizmoCamera?: Camera;
    entity?: any;
    selectedEntity: any;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    contextMenuItems?: IInspectorContextMenuItem[];
}

export class TreeItemComponent extends React.Component<ITreeItemComponentProps, { isExpanded: boolean; mustExpand: boolean }> {
    static _ContextMenuUniqueIdGenerator = 0;

    constructor(props: ITreeItemComponentProps) {
        super(props);

        this.state = { isExpanded: false, mustExpand: false };
    }

    switchExpandedState(): void {
        this.setState({ isExpanded: !this.state.isExpanded, mustExpand: false });
    }

    override shouldComponentUpdate(nextProps: ITreeItemComponentProps, nextState: { isExpanded: boolean }) {
        if (!nextState.isExpanded && this.state.isExpanded) {
            return true;
        }

        const items = nextProps.items;

        if (items && items.length) {
            if (nextProps.selectedEntity) {
                for (const item of items) {
                    if (Tools.LookForItem(item, nextProps.selectedEntity)) {
                        nextState.isExpanded = true;
                        return true;
                    }
                }
            }
        }

        return true;
    }

    expandAll(expand: boolean) {
        this.setState({ isExpanded: expand, mustExpand: expand });
    }

    override render() {
        let items = this.props.items;

        const marginStyle = {
            paddingLeft: 10 * (this.props.offset + 0.5) + "px",
        };

        if (!items) {
            if (this.props.forceSubitems) {
                items = [];
            } else {
                return (
                    <div className="groupContainer" style={marginStyle}>
                        <div>{this.props.label}</div>
                    </div>
                );
            }
        }

        if (!items.length) {
            const contextMenuItems = ConvertToContextMenuItems(this.props.contextMenuItems);
            const header = (
                <div className="context-menu" id={"tree-item-context-menu-" + TreeItemComponent._ContextMenuUniqueIdGenerator++}>
                    <TreeItemRootHeaderComponent label={this.props.label} />
                </div>
            );
            return (
                <div className="groupContainer" style={marginStyle}>
                    {contextMenuItems.length > 0 ? (
                        <FluentToolWrapper toolName="Inspector" useFluent>
                            <ContextMenu trigger={header} items={contextMenuItems} />
                        </FluentToolWrapper>
                    ) : (
                        header
                    )}
                </div>
            );
        }

        if (!this.state.isExpanded) {
            const contextMenuItems = ConvertToContextMenuItems(this.props.contextMenuItems);
            const header = (
                <div className="context-menu" id={"tree-item-context-menu-" + TreeItemComponent._ContextMenuUniqueIdGenerator++}>
                    <TreeItemExpandableHeaderComponent
                        isExpanded={false}
                        label={this.props.label}
                        onClick={() => this.switchExpandedState()}
                        onExpandAll={(expand) => this.expandAll(expand)}
                    />
                </div>
            );
            return (
                <div className="groupContainer" style={marginStyle}>
                    {contextMenuItems.length > 0 ? (
                        <FluentToolWrapper toolName="Inspector" useFluent>
                            <ContextMenu trigger={header} items={contextMenuItems} />
                        </FluentToolWrapper>
                    ) : (
                        header
                    )}
                </div>
            );
        }

        const sortedItems = Tools.SortAndFilter(null, items);
        const contextMenuItems = ConvertToContextMenuItems(this.props.contextMenuItems);
        const header = (
            <div className="context-menu" id={"tree-item-context-menu-" + TreeItemComponent._ContextMenuUniqueIdGenerator++}>
                <TreeItemExpandableHeaderComponent
                    isExpanded={this.state.isExpanded}
                    label={this.props.label}
                    onClick={() => this.switchExpandedState()}
                    onExpandAll={(expand) => this.expandAll(expand)}
                />
            </div>
        );

        return (
            <div>
                <div className="groupContainer" style={marginStyle}>
                    {contextMenuItems.length > 0 ? (
                        <FluentToolWrapper toolName="Inspector" useFluent>
                            <ContextMenu trigger={header} items={contextMenuItems} />
                        </FluentToolWrapper>
                    ) : (
                        header
                    )}
                </div>
                {sortedItems.map((item) => {
                    return (
                        <TreeItemSelectableComponent
                            mustExpand={this.state.mustExpand}
                            extensibilityGroups={this.props.extensibilityGroups}
                            key={item.uniqueId !== undefined && item.uniqueId !== null ? item.uniqueId : item.name}
                            offset={this.props.offset + 1}
                            selectedEntity={this.props.selectedEntity}
                            entity={item}
                            globalState={this.props.globalState}
                            gizmoCamera={this.props.gizmoCamera}
                            filter={this.props.filter}
                        />
                    );
                })}
            </div>
        );
    }
}
