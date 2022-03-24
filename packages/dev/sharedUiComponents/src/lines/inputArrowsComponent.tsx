import * as React from "react";

import upArrowIcon from "./valueUpArrowIcon.svg";
import downArrowIcon from "./valueDownArrowIcon.svg";

interface IInputArrowsComponentProps {
    incrementValue: (amount: number) => void;
    setDragging: (dragging: boolean) => void;
}

export class InputArrowsComponent extends React.Component<IInputArrowsComponentProps> {
    private _arrowsRef = React.createRef<HTMLDivElement>();
    private _drag = (event: MouseEvent) => {
        this.props.incrementValue(-event.movementY);
    };
    private _releaseListener = () => {
        this.props.setDragging(false);
        this._arrowsRef.current?.ownerDocument.exitPointerLock();
        this._arrowsRef.current?.ownerDocument.defaultView!.removeEventListener("pointerup", this._releaseListener);
        this._arrowsRef.current?.ownerDocument.removeEventListener("pointerlockchange", this._lockChangeListener);
        this._arrowsRef.current?.ownerDocument.defaultView!.removeEventListener("mousemove", this._drag);
    };
    private _lockChangeListener = () => {
        if (this._arrowsRef.current?.ownerDocument.pointerLockElement !== this._arrowsRef.current) {
            this._releaseListener();
        }
    };

    render() {
        return (
            <div
                className="arrows"
                ref={this._arrowsRef}
                onPointerDown={() => {
                    this._arrowsRef.current?.ownerDocument.addEventListener("pointerlockchange", this._lockChangeListener);
                    this._arrowsRef.current?.ownerDocument.defaultView!.addEventListener("pointerup", this._releaseListener);
                    this._arrowsRef.current?.ownerDocument.defaultView!.addEventListener("mousemove", this._drag);
                    this.props.setDragging(true);
                    this._arrowsRef.current?.requestPointerLock();
                }}
                onDragStart={(evt) => evt.preventDefault()}
            >
                <img className="upArrowIcon" src={upArrowIcon} alt="Increase Value" />
                <img className="downArrowIcon" src={downArrowIcon} alt="Increase Value" />
            </div>
        );
    }
}
