"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.AndOrNotEvaluator = BABYLON.AndOrNotEvaluator || {};

    BABYLON.AndOrNotEvaluator.Eval = function (query, evaluateCallback) {
        if (!query.match(/\([^\(\)]*\)/g)) {
            query = BABYLON.AndOrNotEvaluator._HandleParenthesisContent(query, evaluateCallback);
        }
        else {
            query = query.replace(/\([^\(\)]*\)/g, function (r) {
                // remove parenthesis
                r = r.slice(1, r.length - 1);
                return BABYLON.AndOrNotEvaluator._HandleParenthesisContent(r, evaluateCallback);
            });
        }

        if (query === "true") {
            return true;
        }

        if (query === "false") {
            return false;
        }

        return BABYLON.AndOrNotEvaluator.Eval(query, evaluateCallback);
    };

    BABYLON.AndOrNotEvaluator._HandleParenthesisContent = function (parenthesisContent, evaluateCallback) {
        evaluateCallback = evaluateCallback || function (r) {
            /*switch(r)
            {
                case "true":
                    return true;
                case "false":
                case "0":
                case "":
                case "undefined":
                case "null":
                default:
                    return false;
            }*/
            return r === "true" ? true : false;
        };

        var result;
        var or = parenthesisContent.split("||");

        for (var i in or) {
            var ori = BABYLON.AndOrNotEvaluator._SimplifyNegation(or[i].trim());
            var and = ori.split("&&");

            if (and.length > 1) {
                for (var j = 0; j < and.length; ++j) {
                    var andj = BABYLON.AndOrNotEvaluator._SimplifyNegation(and[j].trim());
                    if (andj !== "true" && andj !== "false") {
                        if (andj[0] === "!") {
                            result = andj.substring(1);
                            if (evaluateCallback) {
                                result = evaluateCallback(result);
                            }
                            result = !result;
                        }
                        else {
                            result = andj;
                            if (evaluateCallback) {
                                result = evaluateCallback(result);
                            }
                        }
                    }
                    else {
                        result = andj === "true" ? true : false;
                    }
                    if (!result) { // no need to continue since 'false && ... && ...' will always return false
                        ori = "false";
                        break;
                    }
                }
            }

            if (result || ori === "true") { // no need to continue since 'true || ... || ...' will always return true
                result = true;
                break;
            }

            // result equals false (or undefined)

            if (ori !== "true" && ori !== "false") {
                if (ori[0] === "!") {
                    result = ori.substring(1);
                    if (evaluateCallback) {
                        result = evaluateCallback(result);
                    }
                    result = !result;
                }
                else {
                    result = ori;
                    if (evaluateCallback) {
                        result = evaluateCallback(result);
                    }
                }
            }
            else {
                result = ori === "true" ? true : false;
            }
        }

        // the whole parenthesis scope is replaced by 'true' or 'false'
        return result ? "true" : "false";
    };

    BABYLON.AndOrNotEvaluator._SimplifyNegation = function (booleanString) {
        booleanString = booleanString.replace(/^[\s!]+/, function (r) {
            // remove whitespaces
            r = r.replace(/[\s]/g, function (r) {
                return "";
            });
            return r.length % 2 ? "!" : "";
        });

        booleanString = booleanString.trim();

        if (booleanString === "!true") {
            booleanString = "false";
        }
        else if (booleanString === "!false") {
            booleanString = "true";
        }

        return booleanString;
    };

})();