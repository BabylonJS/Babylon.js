module INSPECTOR {
    
    /**
     * Creates a tooltip for the parent of the given html element
     */
    export class Tooltip {
        
        /** The tooltip is displayed for this element */
        private _elem : HTMLElement;
        
        /** The tooltip div */
        private _infoDiv : HTMLDivElement;
        
        constructor(elem: HTMLElement, tip:string, attachTo?:HTMLElement) {
            
            this._elem = elem;
            if (!attachTo) {
                attachTo = this._elem.parentElement;
            }
            this._infoDiv = Helpers.CreateDiv('tooltip', attachTo) as HTMLDivElement;
            

            this._elem.addEventListener('mouseover', () => { 
                this._infoDiv.textContent = tip;
                this._infoDiv.style.display = 'block'
            });
            this._elem.addEventListener('mouseout', () => { this._infoDiv.style.display = 'none'});
        }
    }
}