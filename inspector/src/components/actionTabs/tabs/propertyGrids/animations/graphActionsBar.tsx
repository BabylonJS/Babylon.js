import * as React from 'react';
import { IconButtonLineComponent } from '../../../lines/iconButtonLineComponent';

interface IGraphActionsBarProps {
  addKeyframe: () => void;
  removeKeyframe: () => void;
  handleValueChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFrameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  flatTangent: () => void;
  brokeTangents: () => void;
  setLerpMode: () => void;
  brokenMode: boolean;
  lerpMode: boolean;
  currentValue: number;
  currentFrame: number;
  title: string;
  close: (event: any) => void;
  enabled: boolean;
}

export class GraphActionsBar extends React.Component<IGraphActionsBarProps> {
  constructor(props: IGraphActionsBarProps) {
    super(props);
  }

  render() {
    return (
      <div className='actions-wrapper'>
        <div className='title-container'>
          <div className='icon babylon-logo'></div>
          <div className='title'>{this.props.title}</div>
        </div>
        <div
          className='buttons-container'
          style={{ pointerEvents: this.props.enabled ? 'all' : 'none' }}
        >
          <div className='action-input'>
            <input
              type='number'
              value={this.props.currentFrame}
              onChange={this.props.handleFrameChange}
              step='1'
            />
          </div>
          <div className='action-input'>
            <input
              type='number'
              value={this.props.currentValue}
              onChange={this.props.handleValueChange}
              step='0.1'
            />
          </div>
          <IconButtonLineComponent
            tooltip={'Add Keyframe'}
            icon='new-key'
            onClick={this.props.addKeyframe}
          />
          <IconButtonLineComponent
            tooltip={'Frame selected keyframes'}
            icon='frame'
            onClick={this.props.removeKeyframe}
          />
          <IconButtonLineComponent
            tooltip={'Flat Tangents'}
            icon='flat-tangent'
            onClick={this.props.flatTangent}
          />
          <IconButtonLineComponent
            tooltip={
              this.props.brokenMode ? 'Broken Mode On' : 'Broken Mode Off'
            }
            icon={this.props.brokenMode ? 'break-tangent' : 'unify-tangent'}
            onClick={this.props.brokeTangents}
          />
          <IconButtonLineComponent
            tooltip={this.props.lerpMode ? 'Lerp On' : 'lerp Off'}
            icon='linear-tangent'
            onClick={this.props.setLerpMode}
          />
        </div>
      </div>
    );
  }
}
