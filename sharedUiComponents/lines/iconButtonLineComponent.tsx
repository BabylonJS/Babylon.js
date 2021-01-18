import * as React from 'react';

export interface IIconButtonLineComponentProps {
  icon: string;
  onClick: () => void;
  tooltip: string;
  active?: boolean;
}

export class IconButtonLineComponent extends React.Component<
  IIconButtonLineComponentProps
> {
  constructor(props: IIconButtonLineComponentProps) {
    super(props);
  }

  render() {
    return (
      <div
        style={{ backgroundColor: this.props.active ? '#111111' : '' }}
        title={this.props.tooltip}
        className={`icon ${this.props.icon}`}
        onClick={() => this.props.onClick()}
      />
    );
  }
}
