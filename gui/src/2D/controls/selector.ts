import {Rectangle} from "./rectangle";
import {StackPanel} from "./stackPanel";
import {Control} from "./control";
import {TextBlock} from "./textBlock";
import {Checkbox} from "./checkbox";
import {RadioButton} from "./radioButton";
import {Slider} from "./slider";

/**
 * Class used to store Selector properties
 */
export class Selector {
    /** Text  used for label */
    private _text: string;
    /** Function called when selected */ 
	private _func: () => any; 
    /** whether checked or not */
    private _checked: boolean;
    /** position in array */
    private _nb: number;
    
     /**
     * Creates a new Selector
     * @param text is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     * @param nb is the position of the Selector in the SelectionGroup it is added to
     */
    constructor(text:string, func: ()=> any, checked:boolean, nb: number) {
        this._text = text;
        this._func = func;
        this._checked = checked;
        this._nb = nb;
    }

    /** Gets the text */
    public get text(): string {
        return this._text;
    }
    
    /** Gets the function that is called when checked */
    public get func(): ()=>any {
        return this._func;
    }

    /** Gets the checked value */
    public get checked(): boolean {
        return this._checked;
    }
    
    /** Gets the position number */
    public get nb(): number {
        return this._nb;
    }
}

/**
 * Class used to store SliderBar properties
 */
export class SliderBar{
    /** Text  used for label */
    private _text: string;
    /** Function called when selected */ 
	private _func: () => any; 
    /** unit name, eg degrees, metres, etc */
    private _unit: string;
    /** Function to format value */ 
    private _onVal: (v:number)=> any;
    /** Minimum of value range */
    private _min: number;
    /** Maximum of value range */
    private _max: number;
    /** starting value */
	private _value: number;
    
     /**
     * Creates a new SliderBar
     * @param text is the label for the SliderBar
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param onVal is the function used to format the value displayed, eg radians to degrees
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     */
    constructor(text:string, func: ()=> any, unit: string, onVal: (v:number)=> any, min: number, max: number, value: number) {
        this._text = text;
        this._func = func;
        this._unit = unit;
        this._onVal = onVal;
        this._min = min;
        this._max = max;
        this._value = value;
    }

    /** Gets the text */
    public get text(): string {
        return this._text;
    }
    
    /** Gets the function that is called when slider moves */
    public get func(): ()=>any {
        return this._func;
    }

    /** Gets the function used to format the value of the slider */
    public get onVal(): (v: number)=>any {
        return this._onVal;
    }

    /** Gets the units used */
    public get unit(): string {
        return this._unit;
    }
    
    /** Gets the min value */
    public get min(): number {
        return this._min;
    }

    /** Gets the max value */
    public get max(): number {
        return this._max;
    }

    /** Gets the current value */
    public get value(): number {
        return this._value;
    }
}

/** Class used to create a SelectorGroup 
 * which contains groups of checkboxes, radio buttons and sliders
*/
export class SelectorGroup {
    private _selectors: any[] = new Array();
    private _selectNb = 0;

    /**
     * Creates a new SelectorGroup
     * @param name of group, used as a heading
     * @param type specifies a check box, radio button or slider grouping
     */
    constructor(public name: string, public type: string) {
        if (type === void 0) { type = "C"; }
        type = type.substr(0,1).toUpperCase();
        if(type !="R") {
            if(type != "S") {
                if(type != "C") {
                    type = "C";
                }
            }
        }        
    }

    /** Gets selectors array  */
    public get selectors(): any[] {
        return this._selectors
    }

    /** Gets position  */
    public get selectNb(): number {
        return this._selectNb
    }

    /** Adds a checkbox or radio button to the SelectorGroup
     * @param text is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addSelector(text?: string, func?: () => any , checked?: boolean): void {
        if (text === void 0) { text = ""; }
        if (func === void 0) { func = function(){}; }
        if (checked === void 0) { checked = false; }
        let selector = new Selector(text, func, checked, this._selectNb);
        this.selectors.push(selector);
        if(this.type === "R") {
            this._selectNb++;					
        }
    };

    /**
     * Adds a slider to the SelectorGroup
     * @param text is the label for the SliderBar
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onVal is the function used to format the value displayed, eg radians to degrees
     */
    public addSlider(text?: string, func?: () => any, unit?: string, min?: number, max?: number, value?: number, onVal?: (v:number)=>number) {        
        if (text === void 0) { text = ""; }
        if (func === void 0) { func = function(){}; }
        if (unit === void 0) { unit = "Units"; }
        if (onVal === void 0) { onVal = function(v: number){return v | 0}; }
        if (min === void 0) { min = 0; }
        if (max === void 0) { max = 100; }
        if (value === void 0) { value = 0; }
        let slider_bar = new SliderBar(text, func, unit, onVal, min, max, value);
        this.selectors.push(slider_bar);
    };
}

/** Class used to hold the controls for the checkboxes, radio buttons and sliders */
export class SelectionPanel extends Rectangle {
    private _panel: StackPanel;

    /**
    * Creates a new SelectorGroup
    * @param name of SelectionPanel
    * @param groups is an array of SelectionGroups
    */
    constructor(public name: string, public groups: SelectorGroup[]) {
        super(name);
        this.color = "black";
        this.thickness = 4;
        this.background = "white";
        this._panel = new StackPanel();
        this._panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._panel.top = 5;
        this._panel.left = 5;
        
        this._addGroupHeader(groups[0].name);
        this._addGroup(groups[0]);
        for(var i = 1; i < groups.length; i++) {
            this._addSpacer(groups[i].name);
            this._addGroup(groups[i]);
        }				
        this.addControl(this._panel);
        
        
        return this;
    }
    
    /** Adds the given group to the SelectionPanel
     * @param group, the SelectionGroup to be added
    */
    protected _addGroup(group: SelectorGroup) {
        if(group.type === "R") {
            for(var i = 0; i < group.selectors.length; i++) {
                this._addRadio(group.selectors[i].text, group.selectors[i].nb, group.name, group.selectors[i].func, group.selectors[i].checked);
            }
        }
        else if(group.type === "S") {
            this._panel.width = 1;
            for(var i = 0; i < group.selectors.length; i++) {
                this._addSldr(group.selectors[i].text, group.selectors[i].func, group.selectors[i].unit, group.selectors[i].min, group.selectors[i].max, group.selectors[i].value, group.selectors[i].onVal);
            }
        }
        else {
            for(var i = 0; i < group.selectors.length; i++) {
                this._addCheckbox(group.selectors[i].text, group.selectors[i].func, group.selectors[i].checked);
            }
        }
    }
    
    /** Adds a heading to the group
     * @param name is used as heading
     */
    protected _addGroupHeader(name: string) {
        var groupHeading = new TextBlock("groupHead", name);
        groupHeading.width = 0.9;
        groupHeading.height = "30px";
        groupHeading.textWrapping = true;
        groupHeading.color = "black";
        groupHeading.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.left = "2px";
        this._panel.addControl(groupHeading);
    }
    
    /** Adds a bar between groups
     * @param name is used as heading for the group after the bar
     */
    protected _addSpacer(name: string) {
        var separator = new Rectangle();
        separator.width = 0.9;
        separator.height = "2px";
        separator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        separator.background = "#364249";
        separator.color = "#364249";
        this._panel.addControl(separator);
    
        this._addGroupHeader(name);
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
        button.background = "white"; 
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    
        button.onIsCheckedChangedObservable.add(function(state) {				
            func(state);	
        }); 
    
        var header = Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        header.height = "30px";
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.left = "4px";
    
        this._panel.addControl(header);    
        button.isChecked = checked;
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
        button.background = "white"; 
        button.group = name;
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        button.onIsCheckedChangedObservable.add(function(state) {                       		                  
            if(state) {
                func(nb);
            }
        }); 

        var header = Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
        header.height = "30px";
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.left = "4px";
        this._panel.addControl(header);
        button.isChecked = checked; 			
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
        button.value = value;
        button.minimum = min;
        button.maximum = max;				
        button.width = "0.9";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.borderColor = "black";
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        button.left = "4px";
        var header = new TextBlock();
        header.text = text+": " + value + " " + unit;
        header.height = "30px";
        header.color = "black";
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.left = "4px";
        this._panel.addControl(header);  

        button.onValueChangedObservable.add(function(value) {
            header.text = text + ": " + onValueChange(value) + " " + unit;
            func(value);
        });
        this._panel.addControl(button);
    }
}