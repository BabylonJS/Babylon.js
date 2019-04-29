import * as React from "react";
import { PaneComponent } from "./paneComponent";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface ITabsComponentProps {
    children: any[],
    selectedIndex: number,
    onSelectedIndexChange: (value: number) => void
}

export class TabsComponent extends React.Component<ITabsComponentProps> {
    constructor(props: ITabsComponentProps) {
        super(props);
    }

    onSelect(index: number) {
        this.props.onSelectedIndexChange(index);
    }

    renderLabel(child: PaneComponent, index: number) {
        const activeClass = (this.props.selectedIndex === index ? 'label active' : 'label');
        return (
            <div className={activeClass} key={index} onClick={() => this.onSelect(index)} title={child.props.title}>
                <div>
                    <FontAwesomeIcon icon={child.props.icon} />
                </div>
            </div>
        )
    }

    render() {
        return (
            <div className="tabs" onContextMenu={e => e.preventDefault()}>
                <div className="labels">
                    {
                        this.props.children.map((child: PaneComponent, index) => {
                            return this.renderLabel(child, index);
                        })
                    }
                </div>
                <div className="panes">
                    {this.props.children[this.props.selectedIndex]}
                </div>
            </div>
        );
    }
}
