import * as React from "react";
import { Nullable, Observable, IExplorerExtensibilityGroup } from "babylonjs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faBan } from '@fortawesome/free-solid-svg-icons';
import { TreeItemSelectableComponent } from "./treeItemSelectableComponent";
import { Tools } from "../../tools";

interface ITreeItemExpandableHeaderComponentProps {
    isExpanded: boolean,
    label: string,
    onClick: () => void
}

class TreeItemExpandableHeaderComponent extends React.Component<ITreeItemExpandableHeaderComponentProps> {
    constructor(props: ITreeItemExpandableHeaderComponentProps) {
        super(props);
    }

    render() {
        const chevron = this.props.isExpanded ? <FontAwesomeIcon icon={faMinus} /> : <FontAwesomeIcon icon={faPlus} />

        return (
            <div>
                <span className="arrow icon" onClick={() => this.props.onClick()}>
                    {chevron}
                </span> {this.props.label}
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
            <div>
                <span className="arrow icon">
                    <FontAwesomeIcon icon={faBan} />
                </span> {this.props.label}
            </div>
        )
    }
}

export interface ITreeItemComponentProps {
    items?: Nullable<any[]>,
    label: string,
    offset: number,
    filter: Nullable<string>,
    onSelectionChangeObservable?: Observable<any>,
    entity?: any,
    selectedEntity: any,
    extensibilityGroups?: IExplorerExtensibilityGroup[]
}


export class TreeItemComponent extends React.Component<ITreeItemComponentProps, { isExpanded: boolean }> {
    constructor(props: ITreeItemComponentProps) {
        super(props);

        this.state = { isExpanded: false };
    }

    switchExpandedState(): void {
        this.setState({ isExpanded: !this.state.isExpanded });
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
                    <TreeItemExpandableHeaderComponent isExpanded={false} label={this.props.label} onClick={() => this.switchExpandedState()} />
                </div >
            )
        }

        const sortedItems = Tools.SortAndFilter(items);

        return (
            <div>
                <div className="groupContainer" style={marginStyle}>
                    <TreeItemExpandableHeaderComponent isExpanded={this.state.isExpanded} label={this.props.label} onClick={() => this.switchExpandedState()} />
                </div>
                {
                    sortedItems.map(item => {
                        return (
                            <TreeItemSelectableComponent extensibilityGroups={this.props.extensibilityGroups} key={item.uniqueId} offset={this.props.offset + 2} selectedEntity={this.props.selectedEntity} entity={item} onSelectionChangeObservable={this.props.onSelectionChangeObservable} filter={this.props.filter} />
                        );
                    })
                }
            </div>
        );
    }
}