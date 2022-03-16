import * as React from "react";

const upArrowIcon: string = require("./valueUpArrowIcon.svg");
const downArrowIcon: string = require("./valueDownArrowIcon.svg");

interface IInputArrowsComponentProps {
    incrementValue: (amount: number) => void;
    setDragging: (dragging: boolean) => void;
}

export class InputArrowsComponent extends React.Component<IInputArrowsComponentProps> {
    private _arrowsRef = React.createRef<HTMLDivElement>();
    private _drag = (event: MouseEvent) => {
        this.props.incrementValue(-event.movementY);
    }
    private _releaseListener = () => {
        this.props.setDragging(false);
        this._arrowsRef.current?.ownerDocument.exitPointerLock();
        window.removeEventListener("pointerup", this._releaseListener);
        this._arrowsRef.current?.ownerDocument.removeEventListener("mousemove", this._drag);
    }

    render() {
        return <div
        className="arrows"
        ref={this._arrowsRef}
        onPointerDown={event => {
            this.props.setDragging(true);
            this._arrowsRef.current?.requestPointerLock();
            window.addEventListener("pointerup", this._releaseListener);
            this._arrowsRef.current?.ownerDocument.addEventListener("mousemove", this._drag);
        }} onDragStart={evt => evt.preventDefault()}
    >
        <img className="upArrowIcon" src={upArrowIcon} alt="Increase Value" />
        <img className="downArrowIcon" src={downArrowIcon} alt="Increase Value"/>
    </div>

    }
}