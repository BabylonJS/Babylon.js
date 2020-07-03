import * as React from 'react';

import { Observable } from 'babylonjs/Misc/observable';
import { PropertyChangedEvent } from '../../../../../components/propertyChangedEvent';
import { Animation } from 'babylonjs/Animations/animation';
import { IconButtonLineComponent } from '../../../lines/iconButtonLineComponent';
import { NumericInputComponent } from '../../../lines/numericInputComponent';
import { AddAnimation } from './addAnimation';
import { AnimationListTree, SelectedCoordinate } from './animationListTree';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { TargetedAnimation } from 'babylonjs/Animations/animationGroup';
import { LoadSnippet } from './loadsnippet';
import { SaveSnippet } from './saveSnippet';
import { LockObject } from '../lockObject';
import { GlobalState } from '../../../../globalState';

interface IEditorControlsProps {
  isTargetedAnimation: boolean;
  entity: IAnimatable | TargetedAnimation;
  selected: Animation | null;
  lockObject: LockObject;
  onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
  setNotificationMessage: (message: string) => void;
  selectAnimation: (selected: Animation, axis?: SelectedCoordinate) => void;
  setFps: (fps: number) => void;
  setIsLooping: () => void;
  globalState: GlobalState;
  snippetServer: string;
  deselectAnimation: () => void;
  fps: number;
}

export class EditorControls extends React.Component<
  IEditorControlsProps,
  {
    isAnimationTabOpen: boolean;
    isEditTabOpen: boolean;
    isLoadTabOpen: boolean;
    isSaveTabOpen: boolean;
    isLoopActive: boolean;
    animationsCount: number;
    framesPerSecond: number;
    snippetId: string;
    selected: Animation | undefined;
  }
> {
  constructor(props: IEditorControlsProps) {
    super(props);
    let count = this.props.isTargetedAnimation
      ? 1
      : (this.props.entity as IAnimatable).animations?.length ?? 0;
    this.state = {
      isAnimationTabOpen: count === 0 ? true : false,
      isEditTabOpen: count === 0 ? false : true,
      isSaveTabOpen: false,
      isLoadTabOpen: false,
      isLoopActive: true,
      animationsCount: count,
      framesPerSecond: this.props.fps,
      snippetId: '',
      selected: undefined,
    };
  }

  componentWillReceiveProps(newProps: IEditorControlsProps) {
    if (newProps.fps !== this.props.fps) {
      this.setState({ framesPerSecond: newProps.fps });
    }
  }

  animationAdded() {
    this.setState({
      animationsCount: this.recountAnimations(),
      isEditTabOpen: true,
      isAnimationTabOpen: false,
    });
  }

  finishedUpdate() {
    this.setState({
      isEditTabOpen: true,
      isAnimationTabOpen: false,
      selected: undefined,
    });
  }

  recountAnimations() {
    return (this.props.entity as IAnimatable).animations?.length ?? 0;
  }

  changeLoopBehavior() {
    this.setState({
      isLoopActive: !this.state.isLoopActive,
    });
    this.props.setIsLooping();
  }

  handleTabs(tab: number) {
    let state = {
      isAnimationTabOpen: true,
      isLoadTabOpen: false,
      isSaveTabOpen: false,
      isEditTabOpen: false,
    };

    switch (tab) {
      case 0:
        state = {
          isAnimationTabOpen: true,
          isLoadTabOpen: false,
          isSaveTabOpen: false,
          isEditTabOpen: false,
        };
        break;
      case 1:
        state = {
          isAnimationTabOpen: false,
          isLoadTabOpen: true,
          isSaveTabOpen: false,
          isEditTabOpen: false,
        };
        break;
      case 2:
        state = {
          isAnimationTabOpen: false,
          isLoadTabOpen: false,
          isSaveTabOpen: true,
          isEditTabOpen: false,
        };
        break;
      case 3:
        state = {
          isAnimationTabOpen: false,
          isLoadTabOpen: false,
          isSaveTabOpen: false,
          isEditTabOpen: true,
        };
        break;
    }

    this.setState(state);
  }

  handleChangeFps(fps: number) {
    this.props.setFps(fps);
    this.setState({ framesPerSecond: fps });
    if (this.props.selected) {
      this.props.selected.framePerSecond = fps;
    }
  }

  emptiedList() {
    this.setState({
      animationsCount: this.recountAnimations(),
      isEditTabOpen: false,
      isAnimationTabOpen: true,
    });
  }

  animationsLoaded(numberOfAnimations: number) {
    this.setState({
      animationsCount: numberOfAnimations,
      isEditTabOpen: true,
      isAnimationTabOpen: false,
      isLoadTabOpen: false,
      isSaveTabOpen: false,
    });
  }

  editAnimation(selected: Animation) {
    this.setState({
      selected: selected,
      isEditTabOpen: false,
      isAnimationTabOpen: true,
      isLoadTabOpen: false,
      isSaveTabOpen: false,
    });
  }

  render() {
    return (
      <div className='animation-list'>
        <div className='controls-header'>
          {this.props.isTargetedAnimation ? null : (
            <IconButtonLineComponent
              active={this.state.isAnimationTabOpen}
              tooltip='Add Animation'
              icon='medium add-animation'
              onClick={() => this.handleTabs(0)}
            ></IconButtonLineComponent>
          )}
          <IconButtonLineComponent
            active={this.state.isLoadTabOpen}
            tooltip='Load Animation'
            icon='medium load'
            onClick={() => this.handleTabs(1)}
          ></IconButtonLineComponent>
          {this.state.animationsCount === 0 ? null : (
            <IconButtonLineComponent
              active={this.state.isSaveTabOpen}
              tooltip='Save Animation'
              icon='medium save'
              onClick={() => this.handleTabs(2)}
            ></IconButtonLineComponent>
          )}
          {this.state.animationsCount === 0 ? null : (
            <IconButtonLineComponent
              active={this.state.isEditTabOpen}
              tooltip='Edit Animations'
              icon='medium animation-edit'
              onClick={() => this.handleTabs(3)}
            ></IconButtonLineComponent>
          )}
          {this.state.isEditTabOpen ? (
            <div className='input-fps'>
              <NumericInputComponent
                label={''}
                precision={0}
                value={this.state.framesPerSecond}
                onChange={(framesPerSecond: number) =>
                  this.handleChangeFps(framesPerSecond)
                }
              />
              <p>fps</p>
            </div>
          ) : null}
          {this.state.isEditTabOpen ? (
            <IconButtonLineComponent
              tooltip='Loop/Unloop'
              icon={`medium ${
                this.state.isLoopActive
                  ? 'loop-active last'
                  : 'loop-inactive last'
              }`}
              onClick={() => this.changeLoopBehavior()}
            ></IconButtonLineComponent>
          ) : null}
        </div>
        {this.props.isTargetedAnimation ? null : (
          <AddAnimation
            isOpen={this.state.isAnimationTabOpen}
            close={() => {
              this.setState({ isAnimationTabOpen: false, isEditTabOpen: true });
            }}
            entity={this.props.entity as IAnimatable}
            setNotificationMessage={(message: string) => {
              this.props.setNotificationMessage(message);
            }}
            addedNewAnimation={() => this.animationAdded()}
            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
            fps={this.state.framesPerSecond}
            selectedToUpdate={this.state.selected}
            finishedUpdate={() => this.finishedUpdate()}
          />
        )}

        {this.state.isLoadTabOpen ? (
          <LoadSnippet
            animationsLoaded={(numberOfAnimations: number) =>
              this.animationsLoaded(numberOfAnimations)
            }
            lockObject={this.props.lockObject}
            animations={[]}
            snippetServer={this.props.snippetServer}
            globalState={this.props.globalState}
            setSnippetId={(id: string) => this.setState({ snippetId: id })}
            entity={this.props.entity}
            setNotificationMessage={this.props.setNotificationMessage}
          />
        ) : null}

        {this.state.isSaveTabOpen ? (
          <SaveSnippet
            lockObject={this.props.lockObject}
            animations={(this.props.entity as IAnimatable).animations}
            snippetServer={this.props.snippetServer}
            globalState={this.props.globalState}
            snippetId={this.state.snippetId}
          />
        ) : null}

        {this.state.isEditTabOpen ? (
          <AnimationListTree
            deselectAnimation={() => this.props.deselectAnimation()}
            isTargetedAnimation={this.props.isTargetedAnimation}
            entity={this.props.entity}
            selected={this.props.selected}
            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
            empty={() => this.emptiedList()}
            selectAnimation={this.props.selectAnimation}
            editAnimation={(selected: Animation) =>
              this.editAnimation(selected)
            }
          />
        ) : null}
      </div>
    );
  }
}
