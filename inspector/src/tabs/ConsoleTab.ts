declare function Split(elements: HTMLDivElement[], options: any): void;

module INSPECTOR {

    /** 
     * The console tab will have two features : 
     * - hook all console.log call and display them in this panel (and in the browser console as well)
     * - display all Babylon logs (called with Tools.Log...)
     */
    export class ConsoleTab extends Tab {

        private _inspector : Inspector;
        
        private _consolePanelContent : HTMLElement;
        private _bjsPanelContent : HTMLElement;

        private _oldConsoleLog : any;
        private _oldConsoleWarn : any;
        private _oldConsoleError : any;
        

        constructor(tabbar:TabBar, insp:Inspector) {
            super(tabbar, 'Console');            
            this._inspector = insp;

            // Build the shaders panel : a div that will contains the shaders tree and both shaders panels
            this._panel         = Helpers.CreateDiv('tab-panel') as HTMLDivElement;

            let consolePanel = Helpers.CreateDiv('console-panel') as HTMLDivElement;
            let bjsPanel     = Helpers.CreateDiv('console-panel') as HTMLDivElement;

            this._panel.appendChild(consolePanel);
            this._panel.appendChild(bjsPanel);
                        
            Split([consolePanel, bjsPanel], {
                blockDrag : this._inspector.popupMode,
                sizes:[50, 50],
                direction:'vertical'}
            );  

            // Titles
            let title = Helpers.CreateDiv('console-panel-title', consolePanel);
            title.textContent = 'Console logs';
            title = Helpers.CreateDiv('console-panel-title', bjsPanel);
            title.textContent = 'Babylon.js logs';

            // Contents
            this._consolePanelContent = Helpers.CreateDiv('console-panel-content', consolePanel) as HTMLDivElement;
            this._bjsPanelContent     = Helpers.CreateDiv('console-panel-content', bjsPanel) as HTMLDivElement;

            // Bjs logs
            this._bjsPanelContent.innerHTML = BABYLON.Tools.LogCache;
            BABYLON.Tools.OnNewCacheEntry = (entry: string) => {
                this._bjsPanelContent.innerHTML += entry;
                this._bjsPanelContent.scrollTop = this._bjsPanelContent.scrollHeight; 
            };

            // Testing
            //console.log("This is a console.log message");
            // console.log("That's right, console.log calls are hooked to be written in this window");
            // console.log("Object are also stringify-ed", {width:10, height:30, shape:'rectangular'});
            // console.warn("This is a console.warn message");
            // console.error("This is a console.error message");

            // BABYLON.Tools.Log("This is a message");
            // BABYLON.Tools.Warn("This is a warning");
            // BABYLON.Tools.Error("This is a error");

        }

        /** Overrides super.dispose */
        public dispose() {
            console.log = this._oldConsoleLog;
            console.warn = this._oldConsoleWarn;
            console.error = this._oldConsoleError;

        }
        
        public active(b: boolean){
            super.active(b);
            if(b){
                // save old console.log
                this._oldConsoleLog       = console.log;
                this._oldConsoleWarn      = console.warn;
                this._oldConsoleError     = console.error;

                console.log               = this._addConsoleLog.bind(this);
                console.warn              = this._addConsoleWarn.bind(this);
                console.error             = this._addConsoleError.bind(this);
            }
        }

        private _message(type:string, message:any, caller:string) {
            let callerLine = Helpers.CreateDiv('caller', this._consolePanelContent);
            callerLine.textContent = caller;

            let line = Helpers.CreateDiv(type, this._consolePanelContent); 
            line.textContent += message ; 

            this._consolePanelContent.scrollTop = this._consolePanelContent.scrollHeight; 
        }
        private _addConsoleLog(...params : any[]) {
            
            // Get caller name if not null
            let callerFunc = this._addConsoleLog.caller as Function;
            let caller = callerFunc==null? "Window" : "Function "+ (<any>callerFunc)['name'] + ": ";

            for (var i = 0; i < params.length; i++) {
                this._message('log', params[i], caller);
                // Write again in console does not work on edge, as the console object                 
                // is not instantiate if debugger tools is not open
                if (!Helpers.IsBrowserEdge()) {    
                    this._oldConsoleLog(params[i]);
                }
            }
        }

        private _addConsoleWarn(...params : any[]) {
            
            // Get caller name if not null
            let callerFunc = this._addConsoleLog.caller as Function;
            let caller = callerFunc==null? "Window" : (<any>callerFunc)['name'];

            for (var i = 0; i < params.length; i++) {
                this._message('warn', params[i], caller);
                // Write again in console does not work on edge, as the console object 
                // is not instantiate if debugger tools is not open
                if (!Helpers.IsBrowserEdge()) {    
                    this._oldConsoleWarn(params[i]);
                }
            }
        }

        private _addConsoleError(...params : any[]) {
            
            // Get caller name if not null
            let callerFunc = this._addConsoleLog.caller as Function;
            let caller = callerFunc==null? "Window" : (<any>callerFunc)['name'];

            for (var i = 0; i < params.length; i++) {
                this._message('error', params[i], caller);
                // Write again in console does not work on edge, as the console object 
                // is not instantiate if debugger tools is not open
                if (!Helpers.IsBrowserEdge()) {    
                    this._oldConsoleError(params[i]);
                }
            }
        }

    }

}