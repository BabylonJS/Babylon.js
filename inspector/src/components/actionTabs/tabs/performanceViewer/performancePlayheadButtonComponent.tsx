import { Observable } from 'babylonjs/Misc/observable';
import * as React from 'react';

interface IPerformancePlayheadButtonProps {
    returnToPlayhead: Observable<void>
}
export const PerformancePlayheadButtonComponent: React.FC<IPerformancePlayheadButtonProps> = ({returnToPlayhead}) => {
    const onReturnToLiveClick = () => {
        returnToPlayhead.notifyObservers();
    }

    return (
        <button className="performanceLiveButton" onClick={onReturnToLiveClick}>Return to Playhead</button>
    )
}
