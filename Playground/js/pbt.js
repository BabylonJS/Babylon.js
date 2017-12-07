// jsEditor Manipulation
var PBT = function() {    
    this.decorationStyles = new Array();
    this.decorations = new Array();
    this.lineRanges = new Array();
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    var background = "pbt-back-highlight";
    var margin = "pbt-margin-decor-on";
    if(localStorage.getItem("bjs-playground-theme") =="dark") {
        background += "-dark";
        margin +="-dark";
    }
    this.clearDecorLines = function() {
        this.decorations = jsEditor.deltaDecorations(this.decorations, []);
    }

    this.setDecorLines = function (lineRanges) {    
        this.decorationStyles = [];

    var endLineNm = jsEditor.getModel()._lines.length;
        this.decorationStyles.push({ range: new monaco.Range(1,1,endLineNm,1), options: { isWholeLine: true, inlineClassName: 'pbt-fade' }});
        
        for(var i = 0; i < lineRanges.length; i +=2) {          
            this.decorationStyles.push({ range: new monaco.Range(lineRanges[i],1,lineRanges[i + 1],1), options: { isWholeLine: true, linesDecorationsClassName: margin }});
            this.decorationStyles.push({ range: new monaco.Range(lineRanges[i],1,lineRanges[i + 1],1), options: { isWholeLine: true, className: background }});
            this.decorationStyles.push({ range: new monaco.Range(lineRanges[i],1,lineRanges[i + 1],1), options: { isWholeLine: true, inlineClassName: 'pbt-darken' }});
        }

    this.decorations = jsEditor.deltaDecorations([this.decorations], this.decorationStyles);  
    }

    this.replaceLines = function(lineRange, text) {   
        jsEditor.executeEdits("", [
            { range: new monaco.Range(lineRange[0], 1, lineRange[1], 100000), text: text}
       ]);
    }

    this.replaceText = function(line, start, end, text) {   
        jsEditor.executeEdits("", [
            { range: new monaco.Range(line, start, line, end), text: text}
       ]);
    }

    this.getLineText = function(lineNm) {
        return jsEditor.getModel().getLineContent(lineNm);
    }

    this.hideLines = function(lineRanges) {
        var ranges = [];
        this.lineRanges = lineRanges;
        for(var i = 0; i < lineRanges.length; i +=2) {
            ranges.push(new monaco.Range(lineRanges[i], 1, lineRanges[i + 1], 100000));                
        }
        jsEditor.setHiddenAreas(ranges);
    }

    this.hideRange = function(lineRanges) {       
        var ranges = [];
        lineRanges = this.lineRanges.concat(lineRanges);
        this.lineRanges = lineRanges;
        for(var i = 0; i < lineRanges.length; i +=2) {
            ranges.push(new monaco.Range(lineRanges[i], 1, lineRanges[i + 1], 100000));                
        }
        jsEditor.setHiddenAreas(ranges);
    }

    this.showRange = function(lineRanges) {
        var rangePairs = [];
        var linePairs = [];       
        for(var i = 0; i < this.lineRanges.length; i +=2) {
            rangePairs.push(this.lineRanges[i] + "=" + this.lineRanges[i + 1]);                
        }        
        for(var i = 0; i < lineRanges.length; i +=2) {
            linePairs.push(lineRanges[i] + "=" + lineRanges[i + 1]);                
        }       
        var rangeString = rangePairs.join("-");         
        for(var i = 0; i < linePairs.length; i++) {           
            rangeString = rangeString.replace(linePairs[i]+"-", "");
            rangeString = rangeString.replace("-" + linePairs[i], ""); //when last element
        }        
        rangeString = rangeString.replace(/-/g, ",");       
        rangeString = rangeString.replace(/=/g, ",");       
        lineRanges = rangeString.split(",");      
        lineRanges = lineRanges.map(function(n){
            return parseInt(n);
        });       
        var ranges = [];
        for(var i = 0; i < lineRanges.length; i +=2) {
            ranges.push(new monaco.Range(lineRanges[i], 1, lineRanges[i + 1], 100000));                
        }
        this.lineRanges = lineRanges;        
        jsEditor.setHiddenAreas(ranges);
    }

    this.editOn = function() {
        jsEditor.updateOptions({readOnly: false});
    }

    this.editOff = function() {
        jsEditor.updateOptions({readOnly: true});
    }

    //hide menu items
    this.hideMenu = function() {
        var headings = document.getElementsByClassName('category');
        
        for (var i = 0; i < headings.length; i ++) {
            headings[i].style.visibility = 'hidden';
        }
    
        headings = document.getElementsByClassName('category right');
        
        for (var i = 0; i < headings.length; i ++) {
            headings[i].style.visibility = 'visible';
        }
    }

    //Standard GUI Dialogues
    this.StandardDialog = function(options) {   
        options = options||{};
        var width = options.width||0.5;
        var height = options.height||0.25;
        var top = options.top||0;
        var left = options.left||0;
        var verticalAlignment = options.verticalAlignment||BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        var horizontalAlignment = options.horizontalAlignment||BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        var text = options.text||"Playground Based Tutorial";   
        if(options.useImage === undefined) {
            var useImage = true;
        }
        else {
            var useImage = false;
        }
        var imageURL = options.imageURL||"LogoPBT.png";
        var textBlockWidth = 0.95;
        var textBlockLeft = "2%";
        this.container = new BABYLON.GUI.Rectangle();
        this.container.verticalAlignment = verticalAlignment;
        this.container.horizontalAlignment = horizontalAlignment;
        this.container.width = width;
        this.container.height = height;
        this.container.cornerRadius = 10;
        this.container.color = "#364249";
        this.container.thickness = 4;
        this.container.background = "#CDC8F9";
        this.container.top = top;
        this.container.left = left;   
        advancedTexture.addControl(this.container); 
        if(useImage) {
            this.logoPBT = BABYLON.GUI.Button.CreateImageOnlyButton("but", imageURL);
            this.logoPBT.width = "100px";
            this.logoPBT.height = "100px";
            this.logoPBT.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            this.logoPBT.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.logoPBT.top = 2;
            this.logoPBT.left=2;
            this.logoPBT.color = "#CDC8F9";
            this.container.addControl(this.logoPBT);
            textBlockWidth = 0.6;
            textBlockLeft = "35%";
        }
        this.textBlock = new BABYLON.GUI.TextBlock("text", text);
        this.textBlock.width = textBlockWidth;
        this.textBlock.height = 0.7
        this.textBlock.textWrapping = true;
        this.textBlock.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock.color = "#364249";
        this.textBlock.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.textBlock.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.textBlock.left = textBlockLeft;
        this.textBlock.top = 2;
        this.container.addControl(this.textBlock);

        this.nextButton = BABYLON.GUI.Button.CreateSimpleButton("nextbut", "Next >");
        this.nextButton.width = 0.2
        this.nextButton.height = 0.15;
        this.nextButton.color = "white";
        this.nextButton.cornerRadius = 5;
        this.nextButton.background = "#364249";
        this.nextButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.nextButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.nextButton.left = "78%";
        this.nextButton.top = "80%";
        this.container.addControl(this.nextButton);

        this.prevButton = BABYLON.GUI.Button.CreateSimpleButton("prevbut", "< Prev");
        this.prevButton.width = 0.2
        this.prevButton.height = 0.15;
        this.prevButton.color = "white";
        this.prevButton.cornerRadius = 5;
        this.prevButton.background = "#364249";
        this.prevButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.prevButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.prevButton.left = "2%";
        this.prevButton.top = "80%";
        this.container.addControl(this.prevButton); 

        this.showNext = function() {
            this.nextButton.isVisible = true;
        }

        this.hideNext = function() {
            this.nextButton.isVisible = false;
        }

        this.getNextButton = function() {
            return this.nextButton;
        }

        this.getPrevButton = function() {
            return this.prevButton;
        }

        this.showPrev = function() {
            this.prevButton.isVisible = true;
        }

        this.hidePrev = function() {
            this.prevButton.isVisible = false;
        }

        this.setWidth = function(width) {
            this.container.width = width;
        }

        this.setHeight = function(height) {
            this.container.height = height;
        }

        this.setTop = function(top) {
            this.container.top = top;
        }

        this.setLeft = function(left) {
            this.container.left = left;
        }

        this.getWidth = function() {
            return this.container.width;
        }

        this.getHeight = function() {
            return this.container.height;
        }

        this.getTop = function() {
            return this.container.top;
        }

        this.getLeft = function() {
            return this.container.left;
        }

        this.setHorizontalAlignment = function(hrzAlgn) {
            this.container.horizontalAlignment = hrzAlgn;
        }

        this.setVerticalAlignment = function(vrtAlign) {
            this.container.VerticalAlignmenv = vrtAlign;
        }

        this.setText = function(text) {
            this.textBlock.text = text;
        }

        this.show = function() {
            this.container.isVisible = true;
        }

        this.hide = function() {
            this.container.isVisible = false;
        }

        return this;
    }

//Radio and Checkbox Button GUI
    this.ButtonGroup = function(name, type) {
        this.name = name;
        var type = type||"C"; 
        type = type.substr(0,1).toUpperCase();
        if(type !="R") {
            if(type != "S") {
                if(type != "C") {
                    type = "C";
                }
            }
        }
        this.type = type;   
        this.buttons = new Array();
        
        this.addButton = function(text, func, checked) {
            this.buttons.push({
                text: text||"", 
                func: func||function(){}, 
                checked: checked||false
            });
        }

        this.addSlider = function(text, func, unit, onVal, min, max, value) {        
            this.buttons.push({
                text: text||"",                
                func: func||function(){},
                unit: unit||"", 
                onVal: onVal||function(){},
                min: min||0,
                max: max||10,
                value: value||0
            });
        }
        return this;
    }

    this.SelectionDialog = function(options) {
        options = options||{};
        var justStarted = true;
        var width = options.width||0.3;
        var top = options.top||0;
        var left = options.left||0;  
        var verticalAlignment = options.verticalAlignment||BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        var horizontalAlignment = options.horizontalAlignment||BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;    
        var groups = options.groups; 
        this.container = new BABYLON.GUI.Rectangle();
        this.container.verticalAlignment = verticalAlignment;
        this.container.horizontalAlignment = horizontalAlignment;   
        var height = 36 * groups.length;
        for(var i = 0; i < groups.length; i++) {
            height += 32 * groups[i].buttons.length;
            if(groups[i].type == "S") {
                height += 31 * groups[i].buttons.length;
            }
        }
        this.container.height = height + "px";
        this.container.cornerRadius = 10;
        this.container.color = "#364249";
        this.container.thickness = 4;
        this.container.background = "#CDC8F9";
        this.container.top = top;
        this.container.left = left;
        this.container.width = width;
        advancedTexture.addControl(this.container);
        
        var panel = new BABYLON.GUI.StackPanel(); 
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        panel.top = 5;
        panel.left = 5;
        this.container.addControl(panel);

        var addRadio = function(text, parent, group, func, checked) {
            checked = checked || false;
            var button = new BABYLON.GUI.RadioButton();
            button.width = "20px";
            button.height = "20px";
            button.color = "#364249";
            button.background = "white"; 
            button.group = group;
            button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            button.justStarted = true;
            button.func = func;

            button.onIsCheckedChangedObservable.add(function(state) {                       		
                if (state && !justStarted) {                  
                    func();
                }
            }); 

            var header = BABYLON.GUI.Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
            header.height = "30px";
            header.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            header.left = "4px";

            parent.addControl(header);    
            button.isChecked = checked; 
        }

        var addCheckbox = function(text, parent, func, checked) {
            checked = checked || false;
            var button = new BABYLON.GUI.Checkbox();
            button.width = "20px";
            button.height = "20px";
            button.color = "#364249";
            button.background = "white"; 
            button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            
            button.onIsCheckedChangedObservable.add(function(state) {	
                func();	
            }); 
            
            var header = BABYLON.GUI.Control.AddHeader(button, text, "200px", { isHorizontal: true, controlFirst: true });
            header.height = "30px";
            header.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            header.left = "4px";
            
            parent.addControl(header);    
            button.isChecked = checked;
        }

        var addSldr = function(text, parent, func, unit, onValueChange, min, max, value) {         
            var button = new BABYLON.GUI.Slider();  
            button.value = value;
            button.minimum = min;
            button.maximum = max;
            button.width = "200px";
            button.height = "20px";
            button.color = "#364249";
            button.background = "white"; 
            button.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            button.left = "4px";

            var header = new BABYLON.GUI.TextBlock();
            header.text = text+": " + value + " " + unit;
            header.height = "30px";
            header.color = "#364249";
            header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            header.left = "4px";
            parent.addControl(header);  

            button.onValueChangedObservable.add(function(value) {
                header.text = text + onValueChange(value) + " " + unit;
                func(value);
            });
            parent.addControl(button);
        }

        var groupHeader = function(name) {
            var groupHeading = new BABYLON.GUI.TextBlock("groupHead", name);
            groupHeading.width = 0.9;
            groupHeading.height = "30px";
            groupHeading.textWrapping = true;
            groupHeading.color = "black";
            groupHeading.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            groupHeading.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            groupHeading.left = "2px";
            panel.addControl(groupHeading);
        }

        var addSpacer = function(name) {
            var separator = new BABYLON.GUI.Rectangle();
            separator.width = 1;
            separator.height = "2px";
            separator.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
            separator.background = "#364249";
            separator.color = "#364249";
            panel.addControl(separator);
            
            groupHeader(name);
        }

        this.addGroup = function(group) {
            if(group.type == "R") {
                for(var i = 0; i < group.buttons.length; i++) {
                    addRadio(group.buttons[i].text, panel, group.name, group.buttons[i].func, group.buttons[i].checked);
                }
            }
            else if(group.type == "S") {
                for(var i = 0; i < group.buttons.length; i++) {
                    addSldr(group.buttons[i].text, panel, group.buttons[i].func, group.buttons[i].unit, group.buttons[i].onVal, group.buttons[i].min, group.buttons[i].max, group.buttons[i].value);
                }
            }
            else {
                for(var i = 0; i < group.buttons.length; i++) {
                    addCheckbox(group.buttons[i].text, panel, group.buttons[i].func, group.buttons[i].checked);
                }
            }
            
            
        }
        
        groupHeader(groups[0].name);
        this.addGroup(groups[0]);
        for(var i = 1; i < groups.length; i++) {
            addSpacer(groups[i].name);
            this.addGroup(groups[i]);
        }

        justStarted = false;

        this.setWidth = function(width) {
            this.container.width = width;
        }

        this.setTop = function(top) {
            this.container.top = top;
        }

        this.setLeft = function(left) {
            this.container.left = left;
        }

        this.getWidth = function() {
            return this.container.width;
        }

        this.getTop = function() {
            return this.container.top;
        }

        this.getLeft = function() {
            return this.container.left;
        }

        this.setHorizontalAlignment = function(hrzAlgn) {
            this.container.horizontalAlignment = hrzAlgn;
        }

        this.setVerticalAlignment = function(vrtAlign) {
            this.container.VerticalAlignmenv = vrtAlign;
        }

        this.show = function() {
            this.container.isVisible = true;
        }

        this.hide = function() {
            this.container.isVisible = false;
        }

    return this;

    }
}

showBJSPGMenu = function() {
    var headings = document.getElementsByClassName('category');
    
    for (var i = 0; i < headings.length; i ++) {
        headings[i].style.visibility = 'visible';
    }
}

    