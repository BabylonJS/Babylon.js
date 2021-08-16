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
        <button className="performancePlayheadButton" onClick={onReturnToLiveClick} title="Return to Playhead">Return</button>
    )
}
