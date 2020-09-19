import { Rectangle } from "./rectangle";
import { StackPanel } from "./stackPanel";
import { Control } from "./control";
import { TextBlock } from "./textBlock";
import { Checkbox } from "./checkbox";
import { RadioButton } from "./radioButton";
import { Slider } from "./sliders/slider";
import { Container } from "./container";

/** Class used to create a RadioGroup
 * which contains groups of radio buttons
*/
export class SelectorGroup {
    private _groupPanel = new StackPanel();
    private _selectors: StackPanel[] = new Array();
    private _groupHeader: TextBlock;

    /**
     * Creates a new SelectorGroup
     * @param name of group, used as a group heading
     */
    constructor(
        /** name of SelectorGroup */
        public name: string) {

        this._groupPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._groupPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._groupHeader = this._addGroupHeader(name);
    }

    /** Gets the groupPanel of the SelectorGroup  */
    public get groupPanel(): StackPanel {
        return this._groupPanel;
    }

    /** Gets the selectors array */
    public get selectors(): StackPanel[] {
        return this._selectors;
    }

    /** Gets and sets the group header */
    public get header() {
        return this._groupHeader.text;
    }

    public set header(label: string) {
        if (this._groupHeader.text === "label") {
            return;
        }

        this._groupHeader.text = label;
    }

    /** @hidden */
    private _addGroupHeader(text: string): TextBlock {
        var groupHeading = new TextBlock("groupHead", text);
        groupHeading.width = 0.9;
        groupHeading.height = "30px";
        groupHeading.textWrapping = true;
        groupHeading.color = "black";
        groupHeading.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        groupHeading.left = "2px";
        this._groupPanel.addControl(groupHeading);
        return groupHeading;
    }

    /** @hidden*/
    public _getSelector(selectorNb: number) {
        if (selectorNb < 0 || selectorNb >= this._selectors.length) {
            return;
        }
        return this._selectors[selectorNb];
    }

    /** Removes the selector at the given position
    * @param selectorNb the position of the selector within the group
   */
    public removeSelector(selectorNb: number) {
        if (selectorNb < 0 || selectorNb >= this._selectors.length) {
            return;
        }
        this._groupPanel.removeControl(this._selectors[selectorNb]);
        this._selectors.splice(selectorNb, 1);
    }

}

/** Class used to create a CheckboxGroup
 * which contains groups of checkbox buttons
*/
export class CheckboxGroup extends SelectorGroup {
    /** Adds a checkbox as a control
     * @param text is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addCheckbox(text: string, func = (s: boolean) => { }, checked: boolean = false): void {
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

        this.groupPanel.addControl(_selector);
        this.selectors.push(_selector);
        button.isChecked = checked;

        if (this.groupPanel.parent && this.groupPanel.parent.parent) {
            button.color = (<SelectionPanel>this.groupPanel.parent.parent).buttonColor;
            button.background = (<SelectionPanel>this.groupPanel.parent.parent).buttonBackground;
        }
    }

    /** @hidden */
    public _setSelectorLabel(selectorNb: number, label: string) {
        (<TextBlock>this.selectors[selectorNb].children[1]).text = label;
    }

    /** @hidden */
    public _setSelectorLabelColor(selectorNb: number, color: string) {
        (<TextBlock>this.selectors[selectorNb].children[1]).color = color;
    }

    /** @hidden */
    public _setSelectorButtonColor(selectorNb: number, color: string) {
        this.selectors[selectorNb].children[0].color = color;
    }

    /** @hidden */
    public _setSelectorButtonBackground(selectorNb: number, color: string) {
        (<Checkbox>this.selectors[selectorNb].children[0]).background = color;
    }
}

/** Class used to create a RadioGroup
 * which contains groups of radio buttons
*/
export class RadioGroup extends SelectorGroup {
    private _selectNb = 0;

    /** Adds a radio button as a control
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addRadio(label: string, func = (n: number) => { }, checked = false): void {
        var nb = this._selectNb++;
        var button = new RadioButton();
        button.name = label;
        button.width = "20px";
        button.height = "20px";
        button.color = "#364249";
        button.background = "#CCCCCC";
        button.group = this.name;
        button.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        button.onIsCheckedChangedObservable.add(function(state) {
            if (state) {
                func(nb);
            }
        });

        var _selector = Control.AddHeader(button, label, "200px", { isHorizontal: true, controlFirst: true });
        _selector.height = "30px";
        _selector.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
        this.groupPanel.addControl(_selector);
        this.selectors.push(_selector);
        button.isChecked = checked;

        if (this.groupPanel.parent && this.groupPanel.parent.parent) {
            button.color = (<SelectionPanel>this.groupPanel.parent.parent).buttonColor;
            button.background = (<SelectionPanel>this.groupPanel.parent.parent).buttonBackground;
        }
    }

    /** @hidden */
    public _setSelectorLabel(selectorNb: number, label: string) {
        (<TextBlock>this.selectors[selectorNb].children[1]).text = label;
    }

    /** @hidden */
    public _setSelectorLabelColor(selectorNb: number, color: string) {
        (<TextBlock>this.selectors[selectorNb].children[1]).color = color;
    }

    /** @hidden */
    public _setSelectorButtonColor(selectorNb: number, color: string) {
        this.selectors[selectorNb].children[0].color = color;
    }

    /** @hidden */
    public _setSelectorButtonBackground(selectorNb: number, color: string) {
        (<RadioButton>this.selectors[selectorNb].children[0]).background = color;
    }
}

/** Class used to create a SliderGroup
 * which contains groups of slider buttons
*/
export class SliderGroup extends SelectorGroup {
    /**
     * Adds a slider to the SelectorGroup
     * @param label is the label for the SliderBar
     * @param func is the function called when the Slider moves
     * @param unit is a string describing the units used, eg degrees or metres
     * @param min is the minimum value for the Slider
     * @param max is the maximum value for the Slider
     * @param value is the start value for the Slider between min and max
     * @param onValueChange is the function used to format the value displayed, eg radians to degrees
     */
    public addSlider(label: string, func = (v: number) => { }, unit: string = "Units", min: number = 0, max: number = 0, value: number = 0, onValueChange = (v: number) => { return v | 0; }): void {
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
            (<TextBlock>button.parent!.children[0]).text = button.parent!.children[0].name + ": " + onValueChange(value) + " " + button.name;
            func(value);
        });

        var _selector = Control.AddHeader(button, label + ": " + onValueChange(value) + " " + unit, "30px", { isHorizontal: false, controlFirst: false });
        _selector.height = "60px";
        _selector.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        _selector.left = "4px";
        _selector.children[0].name = label;
        this.groupPanel.addControl(_selector);
        this.selectors.push(_selector);

        if (this.groupPanel.parent && this.groupPanel.parent.parent) {
            button.color = (<SelectionPanel>this.groupPanel.parent.parent).buttonColor;
            button.background = (<SelectionPanel>this.groupPanel.parent.parent).buttonBackground;
        }
    }

    /** @hidden */
    public _setSelectorLabel(selectorNb: number, label: string) {
        this.selectors[selectorNb].children[0].name = label;
        (<TextBlock>this.selectors[selectorNb].children[0]).text = label + ": " + (<Slider>this.selectors[selectorNb].children[1]).value + " " + this.selectors[selectorNb].children[1].name;
    }

    /** @hidden */
    public _setSelectorLabelColor(selectorNb: number, color: string) {
        (<TextBlock>this.selectors[selectorNb].children[0]).color = color;
    }

    /** @hidden */
    public _setSelectorButtonColor(selectorNb: number, color: string) {
        this.selectors[selectorNb].children[1].color = color;
    }

    /** @hidden */
    public _setSelectorButtonBackground(selectorNb: number, color: string) {
        (<Slider>this.selectors[selectorNb].children[1]).background = color;
    }
}

/** Class used to hold the controls for the checkboxes, radio buttons and sliders
 * @see https://doc.babylonjs.com/how_to/selector
*/
export class SelectionPanel extends Rectangle {
    private _panel: StackPanel;
    private _buttonColor: string = "#364249";
    private _buttonBackground: string = "#CCCCCC";
    private _headerColor: string = "black";
    private _barColor: string = "white";
    private _barHeight: string = "2px";
    private _spacerHeight: string = "20px";
    private _labelColor: string;
    private _groups: SelectorGroup[];
    private _bars: any[] = new Array();

    /**
    * Creates a new SelectionPanel
    * @param name of SelectionPanel
    * @param groups is an array of SelectionGroups
    */
    constructor(
        /** name of SelectionPanel */
        public name: string,
        /** an array of SelectionGroups */
        public groups: SelectorGroup[] = []) {
        super(name);
        this._groups = groups;
        this.thickness = 2;
        this._panel = new StackPanel();
        this._panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._panel.top = 5;
        this._panel.left = 5;
        this._panel.width = 0.95;
        if (groups.length > 0) {
            for (var i = 0; i < groups.length - 1; i++) {
                this._panel.addControl(groups[i].groupPanel);
                this._addSpacer();
            }
            this._panel.addControl(groups[groups.length - 1].groupPanel);
        }
        this.addControl(this._panel);
    }

    protected _getTypeName(): string {
        return "SelectionPanel";
    }

    /** Gets or sets the headerColor */
    public get headerColor(): string {
        return this._headerColor;
    }

    public set headerColor(color: string) {
        if (this._headerColor === color) {
            return;
        }
        this._headerColor = color;
        this._setHeaderColor();

    }

    private _setHeaderColor() {
        for (var i = 0; i < this._groups.length; i++) {
            this._groups[i].groupPanel.children[0].color = this._headerColor;
        }
    }

    /** Gets or sets the button color */
    public get buttonColor(): string {
        return this._buttonColor;
    }

    public set buttonColor(color: string) {
        if (this._buttonColor === color) {
            return;
        }

        this._buttonColor = color;
        this._setbuttonColor();

    }

    private _setbuttonColor() {
        for (var i = 0; i < this._groups.length; i++) {
            for (var j = 0; j < this._groups[i].selectors.length; j++) {
                (<CheckboxGroup | RadioGroup | SliderGroup>this._groups[i])._setSelectorButtonColor(j, this._buttonColor);
            }
        }
    }

    /** Gets or sets the label color */
    public get labelColor(): string {
        return this._labelColor;
    }

    public set labelColor(color: string) {
        if (this._labelColor === color) {
            return;
        }
        this._labelColor = color;
        this._setLabelColor();
    }

    private _setLabelColor() {
        for (var i = 0; i < this._groups.length; i++) {
            for (var j = 0; j < this._groups[i].selectors.length; j++) {
                (<CheckboxGroup | RadioGroup | SliderGroup>this._groups[i])._setSelectorLabelColor(j, this._labelColor);
            }
        }
    }

    /** Gets or sets the button background */
    public get buttonBackground(): string {
        return this._buttonBackground;
    }

    public set buttonBackground(color: string) {
        if (this._buttonBackground === color) {
            return;
        }

        this._buttonBackground = color;
        this._setButtonBackground();

    }

    private _setButtonBackground() {
        for (var i = 0; i < this._groups.length; i++) {
            for (var j = 0; j < this._groups[i].selectors.length; j++) {
                (<CheckboxGroup | RadioGroup | SliderGroup>this._groups[i])._setSelectorButtonBackground(j, this._buttonBackground);
            }
        }
    }

    /** Gets or sets the color of separator bar */
    public get barColor(): string {
        return this._barColor;
    }

    public set barColor(color: string) {
        if (this._barColor === color) {
            return;
        }

        this._barColor = color;
        this._setBarColor();
    }

    private _setBarColor() {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].children[0].background = this._barColor;
        }
    }

    /** Gets or sets the height of separator bar */
    public get barHeight(): string {
        return this._barHeight;
    }

    public set barHeight(value: string) {
        if (this._barHeight === value) {
            return;
        }

        this._barHeight = value;
        this._setBarHeight();
    }

    private _setBarHeight() {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].children[0].height = this._barHeight;
        }
    }

    /** Gets or sets the height of spacers*/
    public get spacerHeight(): string {
        return this._spacerHeight;
    }

    public set spacerHeight(value: string) {
        if (this._spacerHeight === value) {
            return;
        }

        this._spacerHeight = value;
        this._setSpacerHeight();
    }

    private _setSpacerHeight() {
        for (var i = 0; i < this._bars.length; i++) {
            this._bars[i].height = this._spacerHeight;
        }
    }

    /** Adds a bar between groups */
    private _addSpacer(): void {
        var separator = new Container();
        separator.width = 1;
        separator.height = this._spacerHeight;
        separator.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        var bar = new Rectangle();
        bar.width = 1;
        bar.height = this._barHeight;
        bar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        bar.background = this._barColor;
        bar.color = "transparent";
        separator.addControl(bar);

        this._panel.addControl(separator);
        this._bars.push(separator);
    }

    /** Add a group to the selection panel
     * @param group is the selector group to add
     */
    public addGroup(group: SelectorGroup): void {
        if (this._groups.length > 0) {
            this._addSpacer();
        }
        this._panel.addControl(group.groupPanel);
        this._groups.push(group);
        group.groupPanel.children[0].color = this._headerColor;
        for (var j = 0; j < group.selectors.length; j++) {
            (<CheckboxGroup | RadioGroup | SliderGroup>group)._setSelectorButtonColor(j, this._buttonColor);
            (<CheckboxGroup | RadioGroup | SliderGroup>group)._setSelectorButtonBackground(j, this._buttonBackground);
        }
    }

    /** Remove the group from the given position
     * @param groupNb is the position of the group in the list
     */
    public removeGroup(groupNb: number): void {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        this._panel.removeControl(group.groupPanel);
        this._groups.splice(groupNb, 1);
        if (groupNb < this._bars.length) {
            this._panel.removeControl(this._bars[groupNb]);
            this._bars.splice(groupNb, 1);
        }
    }

    /** Change a group header label
     * @param label is the new group header label
     * @param groupNb is the number of the group to relabel
     * */
    public setHeaderName(label: string, groupNb: number) {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        (<TextBlock>group.groupPanel.children[0]).text = label;
    }

    /** Change selector label to the one given
     * @param label is the new selector label
     * @param groupNb is the number of the groupcontaining the selector
     * @param selectorNb is the number of the selector within a group to relabel
     * */
    public relabel(label: string, groupNb: number, selectorNb: number): void {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        if (selectorNb < 0 || selectorNb >= group.selectors.length) {
            return;
        }
        (<CheckboxGroup | RadioGroup | SliderGroup>group)._setSelectorLabel(selectorNb, label);
    }

    /** For a given group position remove the selector at the given position
     * @param groupNb is the number of the group to remove the selector from
     * @param selectorNb is the number of the selector within the group
     */
    public removeFromGroupSelector(groupNb: number, selectorNb: number): void {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        if (selectorNb < 0 || selectorNb >= group.selectors.length) {
            return;
        }
        group.removeSelector(selectorNb);
    }

    /** For a given group position of correct type add a checkbox button
     * @param groupNb is the number of the group to remove the selector from
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addToGroupCheckbox(groupNb: number, label: string, func = () => { }, checked: boolean = false): void {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        (<CheckboxGroup>group).addCheckbox(label, func, checked);
    }

    /** For a given group position of correct type add a radio button
     * @param groupNb is the number of the group to remove the selector from
     * @param label is the label for the selector
     * @param func is the function called when the Selector is checked
     * @param checked is true when Selector is checked
     */
    public addToGroupRadio(groupNb: number, label: string, func = () => { }, checked: boolean = false): void {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        (<RadioGroup>group).addRadio(label, func, checked);
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
    public addToGroupSlider(groupNb: number, label: string, func = () => { }, unit: string = "Units", min: number = 0, max: number = 0, value: number = 0, onVal = (v: number) => { return v | 0; }): void {
        if (groupNb < 0 || groupNb >= this._groups.length) {
            return;
        }
        var group = this._groups[groupNb];
        (<SliderGroup>group).addSlider(label, func, unit, min, max, value, onVal);
    }

}