import {Rectangle} from "./rectangle";
import {StackPanel} from "./stackPanel";
import {Control} from "./control";
import {TextBlock} from "./textBlock";
import {Checkbox} from "./checkbox";
import {RadioButton} from "./radioButton";
import {Slider} from "./slider";

/** Class used to create a SelectorGroup 
 * which contains groups of checkboxes, radio buttons and sliders
*/
export class SelectorGroup {
    private _selectNb = 0;
    private _groupPanel = new StackPanel();
    private _selectors: StackPanel[] = new Array();
    private _sliders: Slider[] = new Array();
    

    /**
     * Creates a new SelectorGroup
     * @param name of group, used as a group heading
     * @param type specifies a check box, radio button or slider grouping
     */
    constructor(public name: string, public type: string) {
        if (type === void 0) { type = "C"; }
        type = type.substr(0,1).toUpperCase();
        if(type !=="R") {
            if(type !== "S") {
                if(type !== "C") {
                    type = "C";
                }
            }
        }
        this._groupPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._groupPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._addGroupHeader(name);       
    }

    /** Gets group stackPanel  */
    public get group(): StackPanel {
        return this._groupPanel;
    }

    /** Gets selectors  */
    public get selectors(): StackPanel[] {
        return this._selectors;
    }

    /** Gets siders  */
    public get sliders(): Slider[] {
        return this._sliders;
    }

    /** Adds a checkbox or radio button to the SelectorGroup
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addSelector(label: string, func?: () => any , checked?: boolean): void {
        if(this.type === "S") {
            return
        }
        if (func === void 0) { func = function(){}; }
        if (checked === void 0) { checked = false; }
        switch(this.type) {
            case "C":
                this._addCheckbox(label, func, checked)
            break
            case "R":
                this._addRadio(label, this._selectNb++, name, func, checked)
            break
        }
    };

    /**
     * Adds a slider to the SelectorGroup
     * @param label is the label for the SliderBar
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onVal is the function used to format the value displayed, eg radians to degrees
     */
    public addSlider(label: string, func?: () => any, unit?: string, min?: number, max?: number, value?: number, onVal?: (v:number)=>number) {
        if(this.type !== "S") {
            return;
        }
        if (func === void 0) { func = function(){}; }
        if (unit === void 0) { unit = "Units"; }
        if (onVal === void 0) { onVal = function(v: number){return v | 0}; }
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 100; }
        if (value === void 0) { value = 0; }
        this._addSldr(label, func, unit, min, max, value, onVal)
    };

    /** removes the selector/slider at the given position */
    public removeSelector(selectorNb: number) {
        if(selectorNb < 0) {
            return
        }
        this._groupPanel.removeControl(this._selectors[selectorNb]);
        this._selectors.splice(selectorNb, 1);
    }

    /** Adds a checkbox as a control
     * @param text is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    protected _addCheckbox(text: string, func: (s: any)=>any, checked: boolean) {
        var checked = checked || false;
        var button = new Checkbox();
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC"; 
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    
        button.onIsCheckedChangedObservable.add(function(state) {				
            func(state);	
        }); 
    
        var _selector = Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
    
        this._groupPanel.addControl(_selector);
        this._selectors.push(_selector);    
        button.isChecked = checked;

        if(this._groupPanel.parent) {
            if(this._groupPanel.parent.parent) {
                button.color = this._groupPanel.parent.parent.buttonColor;
                button.background  = this._groupPanel.parent.parent.buttonBackground;
            }
        } 
    }

    /** Adds a radio button as a control
     * @param text is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    protected _addRadio(text: string, nb: number, name: string, func: (n: number)=>any, checked: boolean) {				
        checked = checked || false;
        var button = new RadioButton();
        button.name = text;
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC"; 
        button.group = name;
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        button.onIsCheckedChangedObservable.add(function(state) {                       		                  
            if(state) {
                func(nb);
            }
        });
        
        var _selector = Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
        this._groupPanel.addControl(_selector);
        this._selectors.push(_selector);
        button.isChecked = checked;
        
        if(this._groupPanel.parent) {
            if(this._groupPanel.parent.parent) {
                button.color = this._groupPanel.parent.parent.buttonColor;
                button.background  = this._groupPanel.parent.parent.buttonBackground;
            }
        } 
    }

    /**
     * Adds a slider as a control
     * @param text is the label for the SliderBar
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onVal is the function used to format the value displayed, eg radians to degrees
     */
    protected _addSldr(text: string, func: (v: any)=>any, unit: string, min: number, max:number, value: number, onValueChange: (v: number)=>number) {
        var button = new Slider();  
        button.name = unit;
        button.value = value;
        button.minimum = min;
        button.maximum = max;				
        button.width = 0.9;
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.borderColor = "black";
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.left = "4px";
        button.paddingBottom = "4px";

        button.onValueChangedObservable.add(function(value) {
            button.parent.children[0].text = button.parent.children[0].name + ": " + onValueChange(value) + " " + button.name;
            func(value);
        });
        
        var _selector = Control.AddHeader(button, text + ": " + onValueChange(value) + " " + unit, "30px", { isHorizontal: false, controlFirst: false });
        _selector.height = "60px";
        _selector.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";  
        _selector.children[0].name = text;
        this._groupPanel.addControl(_selector);
        this._selectors.push(_selector) 
        
        if(this._groupPanel.parent) {
            if(this._groupPanel.parent.parent) {
                button.color = this._groupPanel.parent.parent.buttonColor;
                button.background  = this._groupPanel.parent.parent.buttonBackground;
            }
        }
    }

    /** Adds a heading to the group
     * @param name is used as heading
     */
    protected _addGroupHeader(text: string) {
        var groupHeading = new TextBlock("groupHead", text);
        groupHeading.width = 0.9;
        groupHeading.height = "30px";
        groupHeading.textWrapping = true;
        groupHeading.color = "black";
        groupHeading.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.left = "2px";
        this._groupPanel.addControl(groupHeading);
    }

}

/** Class used to hold the controls for the checkboxes, radio buttons and sliders */
export class SelectionPanel extends Rectangle {
    private _panel: StackPanel;
    private _buttonColor: string =  "#364249";
    private _buttonBackground: string = "#CCCCCC"; 
    private _headerColor: string = "black";
    private _barColor: string = "white";
    private _labelColor: string;
    private _groups: SelectorGroup[];
    private _bars: any[] = new Array();


    /**
    * Creates a new SelectorGroup
    * @param name of SelectionPanel
    * @param groups is an array of SelectionGroups
    */
    constructor(public name: string, public groups?: SelectorGroup[]) {
        super(name);
        if (groups === void 0) { groups = new Array() };
        this._groups = groups;
        this.thickness = 4;
        this._panel = new StackPanel();
        this._panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._panel.top = 5;
        this._panel.left = 5;
        this._panel.width = 0.95;       
        if(groups.length > 0) {
            for(var i = 0; i < groups.length - 1; i++) {
                this._panel.addControl(groups[i].group);
                this._addSpacer();
            }
            this._panel.addControl(groups[groups.length - 1].group);
        }				
        this.addControl(this._panel);       
    }
    
    /** get the headerColor */
    public get headerColor(): string {
        return this._headerColor;
    }

    /** set the header color */
    public set headerColor(color: string) {
        if(this._headerColor === color) {
            return;
        }
        this._headerColor = color;
        this._setHeaderColor();

    }

    private _setHeaderColor() {
        for(var i = 0; i < this._groups.length; i++) {                
            this._groups[i].group.children[0].color = this._headerColor;
        }
    }

    /** get the  button color */
    public get  buttonColor(): string {
        return this._buttonColor;
    }

    /** set the  button color */
    public set  buttonColor(color: string) {
        if(this._buttonColor === color) {
            return;
        }

        this._buttonColor = color;
        this._setbuttonColor();

    }

    private _setbuttonColor() {
        var child: number = 0;
        for(var i = 0; i < this._groups.length; i++) {
            child = 0;
            if(this._groups[i].type === "S") {
                child = 1;
            }
            for(var j = 0; j < this._groups[i].selectors.length; j++) {
                this._groups[i].selectors[j].children[child].color = this._buttonColor;
            }         
        }
    }

    /** get the  label color */
    public get  labelColor(): string {
        return this._labelColor;
    }

    /** set the  label color */
    public set  labelColor(color: string) {
        if(this._labelColor === color) {
            return;
        }

        this._labelColor = color;
        this._setlabelColor();

    }

    private _setlabelColor() {
        var child: number = 0;
        for(var i = 0; i < this._groups.length; i++) {
            child = 1;
            if(this._groups[i].type === "S") {
                child = 0;
            }
            for(var j = 0; j < this._groups[i].selectors.length; j++) {
                this._groups[i].selectors[j].children[child].color = this._labelColor;
            }         
        }
    }

    /** get the  button background */
    public get  buttonBackground(): string {
        return this._buttonBackground;
    }

    /** set the  button background */
    public set  buttonBackground(background: string) {
        if(this._buttonBackground === background) {
            return;
        }

        this._buttonBackground = background;
        this._setbuttonBackground();

    }

    private _setbuttonBackground() {
        var child: number = 0;
        for(var i = 0; i < this._groups.length; i++) {
            child = 0;
            if(this._groups[i].type === "S") {
                child = 1;
            }
            for(var j = 0; j < this._groups[i].selectors.length; j++) {
                this._groups[i].selectors[j].children[child].background = this._buttonBackground;
            }         
        }
    }

    /** gets color of separator bar */
    public get barColor(): string {
        return this._barColor;
    }

    /** Sets color of separator bar */
    public set barColor(color: string) {
       if(this._barColor === color) {
           return
       }
       
       this._barColor = color;
       this._setBarColor();
    }

    private _setBarColor() {
        for(var i = 0; i < this._bars.length; i++) {
            this._bars[i].background = this._barColor;
        }
    }

    /** Adds a bar between groups */
    private _addSpacer() {
        var separator = new Rectangle();
        separator.width = 1;
        separator.height = "5px";
        separator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        separator.background = this._barColor;        
        separator.color = "transparent";
        this._panel.addControl(separator);
        this._bars.push(separator);
    }

    /** Add a group to the selection panel
     * @param group is the selctor group to add
     */
    public addGroup(group: SelectorGroup) {
        this._addSpacer();
        this._panel.addControl(group.group);
        this._groups.push(group);
        group.group.children[0].color = this._headerColor;
        let child = 0;
        if(group.type === "S") {
            child = 1;
        }
        for(var j = 0; j < group.selectors.length; j++) {
            group.selectors[j].children[child].color = this._buttonColor;
            group.selectors[j].children[child].background = this._buttonBackground;
        }
    }

    /** Remove the group from the given position
     * @param groupNb is the position of the group in the list
     */
    public removeGroup(groupNb: number) {
        if(groupNb < 0) {
            return
        }
        var group = this._groups[groupNb];
        this._panel.removeControl(group.group);
        this._groups.splice(groupNb, 1);
        if(groupNb < this._bars.length) {
            this._panel.removeControl(this._bars[groupNb]);
            this._bars.splice(groupNb, 1);
        }
    }

    /** Change a group header or selector label to the one given 
     * @param label is the new group header or selector label
     * @param groupNb is the number of the group to relabel; group header is changed when selectorNb is blank
     * @param selectorNb is optional and when present is the number of the selector within a group to relabel
     * */ 
    public relabel(label: string, groupNb: number, selectorNb?: number) {
        if(groupNb < 0) {
            return
        }
        var group = this._groups[groupNb];
        if (selectorNb === void 0) {
            group.group.children[0].text = label;
        }
        else {
            if(selectorNb < 0) {
                return
            }
            if(group.type === "C" || group.type === "R") {
                group.selectors[selectorNb].children[1].text = label;
            }
            if(group.type === "S") {
                group.selectors[selectorNb].children[0].name = label;
                group.selectors[selectorNb].children[0].text = label + ": " + group.selectors[selectorNb].children[1].value + " " + group.selectors[selectorNb].children[1].name;
            }
        }
    }

    /** For a given group position remove the selector at the given position
     * @param groupNb is the number of the group to remove the selector from
     * @param selectorNB is the number of the selector within the group
     */
    public removeFromGroupSelector(groupNb: number, selectorNb: number) {
        if(groupNb < 0) {
            return
        }
        var group = this._groups[groupNb];
        group.removeSelector(selectorNb);
    }

    /** For a given group position of correct type add a checkbox or radio button
     * @param groupNb is the number of the group to remove the selctor from
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addToGroupSelector(groupNb: number, label: string, func?: () => any , checked?: boolean) {
        if(groupNb < 0) {
            return
        }
        var group = this._groups[groupNb];
        group.addSelector(label, func, checked);
    }

    /**
     * For a given slider group add a slider
     * @param groupNb is the number of the group to add the slider to
     * @param label is the label for the Slider
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onVal is the function used to format the value displayed, eg radians to degrees
     */
    public addToGroupSlider(groupNb: number, label: string, func?: () => any, unit?: string, min?: number, max?: number, value?: number, onVal?: (v:number)=>number) {
        if(groupNb < 0) {
            return
        }
        var group = this._groups[groupNb];
        group.addSlider(label, func, unit, min, max, value, onVal);
    }
    
}