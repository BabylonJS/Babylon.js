import * as React from "react";

import type { Nullable } from "core/types";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan } from "@fortawesome/free-solid-svg-icons";
import { TreeItemSelectableComponent } from "./treeItemSelectableComponent";
import { Tools } from "../../tools";
import type { ContextMenuItem } from "shared-ui-components/fluent/primitives/contextMenu";
import { ContextMenu } from "shared-ui-components/fluent/primitives/contextMenu";
import { FluentToolWrapper } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import type { GlobalState } from "../../globalState";

import expandedIcon from "../../imgs/expandedIcon.svg";
import collapsedIcon from "../../imgs/collapsedIcon.svg";

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
        const chevron = this.props.isExpanded ? <img src={expandedIcon} className="icon" /> : <img src={collapsedIcon} className="icon" />;

        return (
            <div className="expandableHeader">
                <div className="text">
                    <div className="arrow icon" onClick={() => this.props.onClick()}>
                        {chevron}
                    </div>
                    <div className="text-value">{this.props.label}</div>
                </div>
                <div className="expandAll icon" onClick={() => this.expandAll()} title={this.props.isExpanded ? "Collapse all" : "Expand all"}>
                    {chevron}
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
    entity?: any;
    selectedEntities: any[];
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    contextMenuItems?: { label: string; action: () => void }[];
}

const ConvertToContextMenuItems = (items?: { label: string; action: () => void }[]): ContextMenuItem[] => {
    if (!items) {
        return [];
    }
    return items.map((item) => ({
        key: item.label,
        label: item.label,
        onClick: item.action,
    }));
};

export class TreeItemComponent extends React.Component<ITreeItemComponentProps, { isExpanded: boolean; mustExpand: boolean }> {
    static _ContextMenuUniqueIdGenerator = 0;

    constructor(props: ITreeItemComponentProps) {
        super(props);

        this.state = { isExpanded: true, mustExpand: true };
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
            for (const item of items) {
                if (Tools.LookForItems(item, nextProps.selectedEntities)) {
                    nextState.isExpanded = true;
                    return true;
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
                        <FluentToolWrapper toolName="GUI Editor" useFluent>
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
                        <FluentToolWrapper toolName="GUI Editor" useFluent>
                            <ContextMenu trigger={header} items={contextMenuItems} />
                        </FluentToolWrapper>
                    ) : (
                        header
                    )}
                </div>
            );
        }

        const sortedItems = Tools.SortAndFilter(null, items)[0].getChildren();
        return (
            <div>
                {sortedItems.map((item: { uniqueId: React.Key | null | undefined; name: React.Key | null | undefined }) => {
                    return (
                        <TreeItemSelectableComponent
                            extensibilityGroups={this.props.extensibilityGroups}
                            key={item.uniqueId !== undefined && item.uniqueId !== null ? item.uniqueId : item.name}
                            offset={this.props.offset + 1}
                            selectedEntities={this.props.selectedEntities}
                            entity={item}
                            globalState={this.props.globalState}
                            filter={this.props.filter}
                        />
                    );
                })}
            </div>
        );
    }
}
