/// <reference path="raphael.js" />
/// <reference path="viewer.js" />
/// <reference path="action.js" />

var AB;
(function (AB) {

    var directActionTemplate = function (parameters, secondArgument) {
        var template = [
            { text: 'target', value: 'Object name?' }
        ];

        if (secondArgument)
            template.push({text: secondArgument, value: 'value...'});

        if (parameters)
            template.push.apply(template, parameters);

        return template;
    }

    var directActionWidthPropertyPath = function (parameters) {
        return directActionTemplate(parameters, 'propertyPath');
    }

    var ActionsBuilder = (function () {
        function ActionsBuilder()
        { }

        //
        // Types
        //
        ActionsBuilder.Type = ActionsBuilder.Type || {};
        ActionsBuilder.Type.TRIGGER = 0;
        ActionsBuilder.Type.ACTION = 1;
        ActionsBuilder.Type.FLOW_CONTROL = 2;
        ActionsBuilder.Type.OBJECT = 3;
        ActionsBuilder.Type.SCENE = 4;

        //
        // Triggers
        //
        ActionsBuilder.Trigger = ActionsBuilder.Trigger || {};
        ActionsBuilder.Trigger[0] = { name: 'NothingTrigger', properties: [] };
        ActionsBuilder.Trigger[1] = { name: 'OnPickTrigger', properties: [] };
        ActionsBuilder.Trigger[2] = { name: 'OnLeftPickTrigger', properties: [] };
        ActionsBuilder.Trigger[3] = { name: 'OnRightPickTrigger', properties: [] };
        ActionsBuilder.Trigger[4] = { name: 'OnCenterPickTrigger', properties: [] };
        ActionsBuilder.Trigger[5] = { name: 'OnPointerOverTrigger', properties: [] };
        ActionsBuilder.Trigger[6] = { name: 'OnPointerOutTrigger', properties: [] };
        ActionsBuilder.Trigger[7] = { name: 'OnEveryFrameTrigger', properties: [] };
        ActionsBuilder.Trigger[8] = { name: 'OnIntersectionEnterTrigger', properties: [{ text: 'parameter', value: 'Object name?' }] };
        ActionsBuilder.Trigger[9] = { name: 'OnIntersectionExitTrigger', properties: [{ text: 'parameter', value: 'Object name?' }] };
        ActionsBuilder.Trigger[10] = { name: 'OnKeyDownTrigger', properties: [{ text: 'parameter:', value: '' }] };
        ActionsBuilder.Trigger[11] = { name: 'OnKeyUpTrigger', properties: [{ text: 'parameter:', value: '' }] };
        ActionsBuilder.Trigger.COUNT = 12;

        //
        // Actions (direct & interpolate)
        //
        ActionsBuilder.Action = ActionsBuilder.Action || {};
        ActionsBuilder.Action[0] = { name: 'SwitchBooleanAction', properties: directActionWidthPropertyPath() };
        ActionsBuilder.Action[1] = { name: 'SetStateAction', properties: directActionTemplate(null, 'value') };
        ActionsBuilder.Action[2] = { name: 'SetValueAction', properties: directActionWidthPropertyPath([{ text: 'value', value: 'value?' }]) };
        ActionsBuilder.Action[3] = { name: 'IncrementValueAction', properties: directActionWidthPropertyPath([{ text: 'value', value: 'value?' }]) };
        ActionsBuilder.Action[4] = { name: 'PlayAnimationAction', properties: directActionTemplate([{ text: 'from', value: '0' }, { text: 'to', value: '150' }, { text: 'loop', value: 'false' }]) };
        ActionsBuilder.Action[5] = { name: 'StopAnimationAction', properties: directActionTemplate() };
        ActionsBuilder.Action[6] = { name: 'DoNothingAction', properties: [] };
        ActionsBuilder.Action[7] = { name: 'CombineAction', properties: [] };
        ActionsBuilder.Action[8] = {
            name: 'InterpolateValueAction', properties: directActionWidthPropertyPath([
                { text: 'value', value: 'value' },
                { text: 'duration', value: '1000' },
                { text: 'stopOtherAnimations', value: 'false' }])
        };
        ActionsBuilder.Action.COUNT = 9;

        //
        // Flow Control
        //
        ActionsBuilder.FlowAction = ActionsBuilder.FlowAction || {};
        ActionsBuilder.FlowAction[0] = { name: 'ValueCondition', properties: directActionWidthPropertyPath([{ text: 'value', value: 'value?' }, { text: 'operator', value: 'IsEqual' }]) };
        ActionsBuilder.FlowAction[1] = { name: 'StateCondition', properties: directActionTemplate([{ text: 'value', value: 'value?' }]) };
        ActionsBuilder.FlowAction.COUNT = 2;

        return ActionsBuilder;
    })();

    AB.ActionsBuilder = ActionsBuilder;
})(AB || (AB = {}));
