import { GlobalState } from '../globalState';
import { Utilities } from './utilities';

export class ShortcutManager {

    public constructor(public globalState: GlobalState) {  
        this._register();
    }

    private _register() {
        // HotKeys
        document.onkeydown = (e) => {
            // Alt+Enter to Run
            if (e.altKey && (e.keyCode === 13)) {
                this.globalState.onRunRequiredObservable.notifyObservers();
                return;
            }
            
            // Ctrl+Shift+S to Download Zip
            if (
                (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
                e.shiftKey &&
                (e.keyCode === 83)
            ) {
                this.globalState.onDownloadRequiredObservable.notifyObservers();
                return;
            }

            // Ctrl+S to Save
            if (
                (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
                (e.keyCode === 83)
            ) {
                e.preventDefault();
                if (!Utilities.ReadBoolFromStore("ctrl-s-to-save")) {
                    return;
                }
                this.globalState.onSaveRequiredObservable.notifyObservers();
                return;
            }
        };
    }
}