import * as React from "react";

import { Nullable } from "babylonjs/types";
import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faBan, faExpandArrowsAlt, faCompress } from '@fortawesome/free-solid-svg-icons';
import { TreeItemSelectableComponent } from "./treeItemSelectableComponent";
import { Tools } from "../../tools";
import { GlobalState } from "../globalState";

interface ITreeItemExpandableHeaderComponentProps {
    isExpanded: boolean,
    label: string,
    onClick: () => void,
    onExpandAll: (expand: boolean) => void
}

class TreeItemExpandableHeaderComponent extends React.Component<ITreeItemExpandableHeaderComponentProps> {
    constructor(props: ITreeItemExpandableHeaderComponentProps) {
        super(props);
    }

    expandAll() {
        this.props.onExpandAll(!this.props.isExpanded);
    }

    render() {
        const chevron = this.props.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />
        const expandAll = this.props.isExpanded ? <FontAwesomeIcon icon={faCompress} /> : <FontAwesomeIcon icon={faExpandArrowsAlt} />

        return (
            <div className="expandableHeader">
                <div className="text">
                    <div className="arrow icon" onClick={() => this.props.onClick()}>
                        {chevron}
                    </div>
                    <div className="text-value">
                        {this.props.label}
                    </div>
                </div>
                <div className="expandAll icon" onClick={() => this.expandAll()} title={this.props.isExpanded ? "Collapse all" : "Expand all"}>
                    {expandAll}
                </div>
            </div>
        )
    }
}

interface ITreeItemRootHeaderComponentProps {
    label: string
}

class TreeItemRootHeaderComponent extends React.Component<ITreeItemRootHeaderComponentProps> {
    constructor(props: ITreeItemRootHeaderComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="expandableHeader">
                <div className="text">
                    <div className="arrow icon">
                        <FontAwesomeIcon icon={faBan} />
                    </div>
                    <div className="text-value">
                        {this.props.label}
                    </div>
                </div>
            </div>
        )
    }
}

export interface ITreeItemComponentProps {
    items?: Nullable<any[]>,
    label: string,
    offset: number,
    filter: Nullable<string>,
    globalState: GlobalState,
    entity?: any,
    selectedEntity: any,
    extensibilityGroups?: IExplorerExtensibilityGroup[]
}

export class TreeItemComponent extends React.Component<ITreeItemComponentProps, { isExpanded: boolean, mustExpand: boolean }> {
    constructor(props: ITreeItemComponentProps) {
        super(props);

        this.state = { isExpanded: false, mustExpand: false };
    }

    switchExpandedState(): void {
        this.setState({ isExpanded: !this.state.isExpanded, mustExpand: false });
    }

    shouldComponentUpdate(nextProps: ITreeItemComponentProps, nextState: { isExpanded: boolean }) {
        if (!nextState.isExpanded && this.state.isExpanded) {
            return true;
        }

        const items = nextProps.items;

        if (items && items.length) {
            if (nextProps.selectedEntity) {
                for (var item of items) {
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

    render() {
        const items = this.props.items;

        const marginStyle = {
            paddingLeft: (10 * (this.props.offset + 0.5)) + "px"
        }

        if (!items) {
            return (
                <div className="groupContainer" style={marginStyle}>
                    <div>
                        {this.props.label}
                    </div>
                </div>
            )
        }

        if (!items.length) {
            return (
                <div className="groupContainer" style={marginStyle}>
                    <TreeItemRootHeaderComponent label={this.props.label} />
                </div>
            )
        }

        if (!this.state.isExpanded) {
            return (
                <div className="groupContainer" style={marginStyle}>
                    <TreeItemExpandableHeaderComponent isExpanded={false} label={this.props.label} onClick={() => this.switchExpandedState()} onExpandAll={expand => this.expandAll(expand)} />
                </div >
            )
        }

        const sortedItems = Tools.SortAndFilter(null, items);

        return (
            <div>
                <div className="groupContainer" style={marginStyle}>
                    <TreeItemExpandableHeaderComponent isExpanded={this.state.isExpanded} label={this.props.label} onClick={() => this.switchExpandedState()} onExpandAll={expand => this.expandAll(expand)} />
                </div>
                {
                    sortedItems.map(item => {
                        return (
                            <TreeItemSelectableComponent mustExpand={this.state.mustExpand} extensibilityGroups={this.props.extensibilityGroups}
                                key={item.uniqueId}
                                offset={this.props.offset + 1} selectedEntity={this.props.selectedEntity} entity={item}
                                globalState={this.props.globalState} filter={this.props.filter} />
                        );
                    })
                }
            </div>
        );
    }
}