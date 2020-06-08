'use strict';

var fs = require('fs');
var Vinyl = require('vinyl');
var through = require('through2');
var PluginError = require('plugin-error');
var nodeColorConsole = require('../../NodeHelpers/colorConsole');

const log = nodeColorConsole.log;
const warn = nodeColorConsole.warn;
const err = nodeColorConsole.error;
const success = nodeColorConsole.success;

// ______________________________________________ VALIDATION ____________________________________________

function unixStylePath(filePath) {
    return filePath.replace(/\\/g, '/');
}

function Validate(validationBaselineFileName, namespaceName, validateNamingConvention, generateBaseLine) {
    this.validationBaselineFileName = validationBaselineFileName;
    this.namespaceName = namespaceName;
    this.validateNamingConvention = validateNamingConvention;
    this.generateBaseLine = generateBaseLine;

    this.previousResults = {};
    this.results = {
        errors: 0
    };
}

Validate.hasTag = function(node, tagName) {
    tagName = tagName.trim().toLowerCase();

    if (node.comment && node.comment.tags) {
        for (var i = 0; i < node.comment.tags.length; i++) {
            if (node.comment.tags[i].tag === tagName) {
                return true;
            }
        }
    }

    return false;
}

Validate.position = function(node) {
    if (!node.sources) {
        log(node);
    }
    return node.sources[0].fileName + ':' + node.sources[0].line;
}

Validate.upperCase = new RegExp("^[A-Z_]*$");
Validate.pascalCase = new RegExp("^[A-Z][a-zA-Z0-9_]*$");
Validate.camelCase = new RegExp("^[a-z][a-zA-Z0-9_]*$");
Validate.underscoreCamelCase = new RegExp("^_[a-z][a-zA-Z0-9_]*$");
Validate.underscorePascalCase = new RegExp("^_[A-Z][a-zA-Z0-9_]*$");

Validate.prototype.errorCallback = function(parent, node, nodeKind, category, type, msg, position) {
    this.results[this.filePath] = this.results[this.filePath] || { errors: 0 };
    var results = this.results[this.filePath];

    if (node === "toString") {
        node = "ToString";
    }

    // Checks against previous results.
    var previousResults = this.previousResults[this.filePath];
    if (previousResults) {
        var previousRootName = parent ? parent : node;
        var needCheck = true;

        if (Array.isArray(previousRootName)) {
            while (previousRootName.length > 1) {
                var previousFirst = previousRootName.shift();
                previousResults = previousResults[previousFirst];
                if (!previousResults) {
                    needCheck = false;
                    break;
                }
            }
            previousRootName = previousRootName.shift();
        }

        if (needCheck) {
            var previousNode = previousResults[previousRootName];
            if (previousNode) {
                var previousNodeKind = previousNode[nodeKind];
                if (previousNodeKind) {

                    if (parent) {
                        previousNode = previousNodeKind[node];
                    }
                    else {
                        previousNode = previousNodeKind;
                    }

                    if (previousNode) {
                        var previousCategory = previousNode[category];
                        if (previousCategory) {
                            var previousType = previousCategory[type];
                            if (previousType) {
                                // Early exit as it was already in the previous build.
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    // Write Error in output JSON.
    var rootName = parent ? parent : node;
    var current = results;
    if (Array.isArray(rootName)) {
        while (rootName.length > 1) {
            var first = rootName.shift();
            current = current[first] = current[first] || {};
        }
        rootName = rootName.shift();
    }

    current = current[rootName] = current[rootName] || {};
    current = current[nodeKind] = current[nodeKind] || {};
    if (parent) {
        current = current[node] = current[node] || {};
    }
    current = current[category] = current[category] || {};
    current = current[type] = true;

    results.errors++;

    if (!this.generateBaseLine) {
        err(msg, position);
    }
}

Validate.prototype.init = function(cb) {
    var self = this;
    if (!this.generateBaseLine && fs.existsSync(this.validationBaselineFileName)) {
        fs.readFile(this.validationBaselineFileName, "utf-8", function(err, data) {
            self.previousResults = JSON.parse(data);
            cb();
        });
    }
    else {
        cb();
    }
}

Validate.prototype.add = function(filePath, content) {
    this.filePath = filePath && unixStylePath(filePath);

    if (!Buffer.isBuffer(content)) {
        content = Buffer.from(content);
    }

    var contentString = content.toString();
    var json = JSON.parse(contentString);

    this.validateTypedoc(json);
    if (this.results[this.filePath]) {
        this.results.errors += this.results[this.filePath].errors;
    }
}

Validate.prototype.getResults = function() {
    return this.results;
}

Validate.prototype.getContents = function() {
    return Buffer.from(JSON.stringify(this.results));
}

/**
 * Validate a TypeDoc JSON file
 */
Validate.prototype.validateTypedoc = function(json) {
    for (var i = 0; i < json.children.length; i++) {
        var namespaces = json.children[i].children;
        this.validateTypedocNamespaces(namespaces);
    }
}
/**
 * Validate namespaces attach to a declaration file from a TypeDoc JSON file
 */
Validate.prototype.validateTypedocNamespaces = function(namespaces) {
    var namespace = null;

    // Check for BABYLON namespace
    for (var child in namespaces) {
        if (namespaces[child].name === this.namespaceName) {
            namespace = namespaces[child];
            break;
        }
    }

    // Exit if not BABYLON related.
    if (!namespace || !namespace.children) {
        return;
    }

    // Validate the namespace.
    this.validateTypedocNamespace(namespace);
}

/**
 * Validate classes and modules attach to a declaration file from a TypeDoc JSON file
 */
Validate.prototype.validateTypedocNamespace = function(namespace) {
    var containerNode;
    var childNode;
    var children;
    var signatures;
    var signatureNode;
    var tags;
    var isPublic;

    for (var a in namespace.children) {
        containerNode = namespace.children[a];

        // Validate Sub Module
        if (containerNode.kindString === "Module" || containerNode.kindString === "Namespace") {
            this.validateTypedocNamespace(containerNode);
            continue;
        }
        // else Validate Classes

        // Account for undefined access modifiers.
        if (!containerNode.flags.isPublic &&
            !containerNode.flags.isPrivate &&
            !containerNode.flags.isProtected) {
            containerNode.flags.isPublic = true;
        }
        isPublic = containerNode.flags.isPublic;

        // Validate naming.
        this.validateNaming(null, containerNode);

        // Validate Comments.
        if (isPublic && !this.validateComment(containerNode)) {
            this.errorCallback(null,
                containerNode.name,
                containerNode.kindString,
                "Comments",
                "MissingText",
                "Missing text for " + containerNode.kindString + " : " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(containerNode));
        }

        children = containerNode.children;

        //Validate Properties
        if (children) {
            for (var b in children) {
                childNode = children[b];

                // Account for undefined access modifiers.
                if (!childNode.flags.isPublic &&
                    !childNode.flags.isPrivate &&
                    !childNode.flags.isProtected) {
                    childNode.flags.isPublic = true;
                }
                isPublic = childNode.flags.isPublic;

                // Validate Naming.
                this.validateNaming(containerNode, childNode);

                if (isPublic) {
                    tags = this.validateTags(childNode);
                    if (tags) {
                        this.errorCallback(containerNode.name,
                            childNode.name,
                            childNode.kindString,
                            "Tags",
                            tags,
                            "Unrecognized tag " + tags + " at " + childNode.name + " (id: " + childNode.id + ") in " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(childNode));
                    }
                }

                if (!this.validateComment(childNode)) {
                    //Validate Signatures
                    signatures = childNode.signatures;
                    if (signatures) {
                        for (var c in signatures) {
                            signatureNode = signatures[c];

                            if (isPublic) {
                                if (!this.validateComment(signatureNode)) {
                                    this.errorCallback(containerNode.name,
                                        signatureNode.name,
                                        childNode.kindString,
                                        "Comments",
                                        "MissingText",
                                        "Missing text for " + childNode.kindString + " : " + signatureNode.name + " (id: " + signatureNode.id + ") in " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(childNode));
                                }

                                tags = this.validateTags(signatureNode);
                                if (tags) {
                                    this.errorCallback(containerNode.name,
                                        signatureNode.name,
                                        childNode.kindString,
                                        "Tags",
                                        tags,
                                        "Unrecognized tag " + tags + " at " + signatureNode.name + " (id: " + signatureNode.id + ") in " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(childNode));
                                }

                                if (signatureNode.kindString !== "Constructor" &&
                                    signatureNode.kindString !== "Constructor signature") {
                                    if (signatureNode.type.name !== "void" && signatureNode.comment && !signatureNode.comment.returns) {
                                        this.errorCallback(containerNode.name,
                                            signatureNode.name,
                                            childNode.kindString,
                                            "Comments",
                                            "MissingReturn",
                                            "No Return Comment at " + signatureNode.name + " (id: " + signatureNode.id + ") in " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(childNode));
                                    }

                                    if (signatureNode.type.name === "void" && signatureNode.comment && signatureNode.comment.returns) {
                                        this.errorCallback(containerNode.name,
                                            signatureNode.name,
                                            childNode.kindString,
                                            "Comments",
                                            "UselessReturn",
                                            "No Return Comment Needed at " + signatureNode.name + " (id: " + signatureNode.id + ") in " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(childNode));
                                    }
                                }
                            }

                            this.validateParameters(containerNode, childNode, signatureNode, signatureNode.parameters, isPublic);
                        }
                    } else {
                        this.errorCallback(containerNode.name,
                            childNode.name,
                            childNode.kindString,
                            "Comments",
                            "MissingText",
                            "Missing text for " + childNode.kindString + " : " + childNode.name + " (id: " + childNode.id + ") in " + containerNode.name + " (id: " + containerNode.id + ")", Validate.position(childNode));
                    }
                }

                // this.validateParameters(containerNode, childNode, childNode.parameters, isPublic);
            }
        }
    }
}

/**
 * Validate that tags are recognized
 */
Validate.prototype.validateTags = function(node) {
    var tags;
    var errorTags = [];

    if (node.comment) {

        tags = node.comment.tags;
        if (tags) {
            for (var i = 0; i < tags.length; i++) {
                var tag = tags[i];
                var validTags = ["constructor", "throw", "type", "deprecated", "example", "examples", "remark", "see", "remarks", "ignorenaming"]
                if (validTags.indexOf(tag.tag) === -1) {
                    errorTags.push(tag.tag);
                }
            }
        }

    }

    return errorTags.join(",");
}

/**
 * Validate that a JSON node has the correct TypeDoc comments
 */
Validate.prototype.validateComment = function(node) {

    // Return true for all contents coming from the TS d.ts
    if (node.sources && node.sources[0].fileName.indexOf("lib.dom.d.ts") > -1) {
        return true;
    }

    // Return-only methods are allowed to just have a @return tag
    if ((node.kindString === "Call signature" || node.kindString === "Accessor") && !node.parameters && node.comment && node.comment.returns) {
        return true;
    }

    // Return true for private properties (dont validate)
    if ((node.kindString === "Property" || node.kindString === "Object literal") && (node.flags.isPrivate || node.flags.isProtected)) {
        return true;
    }

    // Return true for inherited properties
    if (node.inheritedFrom) {
        return true;
    }

    // Return true for overwrited properties
    if (node.overwrites) {
        return true;
    }

    // Check comments.
    if (node.comment) {
        if (node.comment.text || node.comment.shortText) {
            return node.kindString !== "Constructor";
        }

        return false;
    }

    // Return true for inherited properties (need to check signatures)
    if (node.kindString === "Function") {
        return true;
    }
    return false;
}

/**
 * Validate comments for paramters on a node
 */
Validate.prototype.validateParameters = function(containerNode, method, signature, parameters, isPublic) {
    var parametersNode;
    for (var parameter in parameters) {
        parametersNode = parameters[parameter];

        if (isPublic && !this.validateComment(parametersNode)) {
            // throw containerNode.name + " " + method.kindString + " " + method.name + " " + parametersNode.name + " " + parametersNode.kindString;
            this.errorCallback([containerNode.name, method.kindString, signature.name],
                parametersNode.name,
                parametersNode.kindString,
                "Comments",
                "MissingText",
                "Missing text for parameter " + parametersNode.name + " (id: " + parametersNode.id + ") of " + method.name + " (id: " + method.id + ")", Validate.position(method));
        }

        if (this.validateNamingConvention && !Validate.camelCase.test(parametersNode.name)) {
            if (containerNode.kindString === "Constructor" ||
                containerNode.kindString !== "Constructor signature") {
                if (Validate.underscoreCamelCase.test(parametersNode.name)) {
                    continue;
                }
            }
            this.errorCallback([containerNode.name, method.kindString, signature.name],
                parametersNode.name,
                parametersNode.kindString,
                "Naming",
                "NotCamelCase",
                "Parameter " + parametersNode.name + " should be Camel Case (id: " + method.id + ")", Validate.position(method));
        }
    }
}

/**
 * Validate naming conventions of a node
 */
Validate.prototype.validateNaming = function(parent, node) {
    if (!this.validateNamingConvention) {
        return;
    }

    // Ignore Naming Tag Check
    if (Validate.hasTag(node, 'ignoreNaming')) {
        return;
    } else {
        if (node.signatures) {
            for (var index = 0; index < node.signatures.length; index++) {
                var signature = node.signatures[index];
                if (Validate.hasTag(signature, 'ignoreNaming')) {
                    return;
                }
            }
        }
    }

    if (node.inheritedFrom) {
        return;
    }

    // Internals are not subject to the public visibility policy.
    if (node.name && node.name.length > 0 && node.name[0] === "_") {
        return;
    }

    if ((node.flags.isPrivate || node.flags.isProtected) && node.flags.isStatic) {
        if (!Validate.underscorePascalCase.test(node.name)) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotUnderscorePascalCase",
                node.name + " should be Underscore Pascal Case (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.flags.isPrivate || node.flags.isProtected) {
        if (!Validate.underscoreCamelCase.test(node.name)) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotUnderscoreCamelCase",
                node.name + " should be Underscore Camel Case (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.flags.isStatic) {
        if (!Validate.pascalCase.test(node.name)) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotPascalCase",
                node.name + " should be Pascal Case (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.kindString == "Module") {
        if (!(Validate.upperCase.test(node.name) || Validate.pascalCase.test(node.name))) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotUpperCase",
                "Module is not Upper Case or Pascal Case " + node.name + " (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.kindString == "Interface" ||
        node.kindString == "Class" ||
        node.kindString == "Enumeration" ||
        node.kindString == "Enumeration member" ||        
        node.kindString == "Type alias") {
        if (!Validate.pascalCase.test(node.name)) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotPascalCase",
                node.name + " should be Pascal Case (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.kindString == "Method" ||
        node.kindString == "Property" ||
        node.kindString == "Accessor" ||
        node.kindString == "Object literal") {

        // Only warn here as special properties such as FOV may be better capitalized 
        if (!Validate.camelCase.test(node.name)) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotCamelCase",
                node.name + " should be Camel Case (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.kindString == "Variable") {
        this.errorCallback(parent ? parent.name : null,
            node.name,
            node.kindString,
            "Naming",
            "ShouldNotBeLooseVariable",
            node.name + " should not be a variable (id: " + node.id + ")", Validate.position(node));
    }
    else if (node.kindString === "Function") {
        if (!Validate.camelCase.test(node.name)) {
            this.errorCallback(parent ? parent.name : null,
                node.name,
                node.kindString,
                "Naming",
                "NotCamelCase",
                node.name + " should be Camel Case (id: " + node.id + ")", Validate.position(node));
        }
    }
    else if (node.kindString == "Constructor") {
        // Do Nothing Here, this is handled through the class name.
    }
    else {
        this.errorCallback(parent ? parent.name : null,
            node.name,
            node.kindString,
            "Naming",
            "UnknownNamingConvention",
            "Unknown naming convention for " + node.kindString + " at " + node.name + " (id: " + node.id + ")", Validate.position(node));
    }
}

// ______________________________________________ PLUGIN ____________________________________________

// consts
const PLUGIN_NAME = 'gulp-validateTypedoc';

// plugin level function (dealing with files)
function gulpValidateTypedoc(validationBaselineFileName, namespaceName, validateNamingConvention, generateBaseLine) {

    if (!validationBaselineFileName) {
        throw new PluginError(PLUGIN_NAME, 'Missing validation filename!');
    }
    if (typeof validationBaselineFileName !== "string") {
        throw new PluginError(PLUGIN_NAME, 'Validation filename must be a string!');
    }

    var validate;
    var latestFile;

    function bufferContents(file, enc, cb) {
        // ignore empty files
        if (file.isNull()) {
            cb();
            return;
        }

        // we don't do streams (yet)
        if (file.isStream()) {
            this.emit('error', new Error('gulp-validatTypedoc: Streaming not supported'));
            cb();
            return;
        }

        // set latest file if not already set,
        // or if the current file was modified more recently.
        latestFile = file;

        // What will happen once all set.
        var done = function() {
            // add file to concat instance
            validate.add(file.relative, file.contents);

            cb();
        }

        // Do the validation.
        if (!validate) {
            validate = new Validate(validationBaselineFileName, namespaceName, validateNamingConvention, generateBaseLine);
            validate.init(done);
        }
        else {
            done();
        }
    }

    function endStream(cb) {
        // no files passed in, no file goes out
        if (!latestFile) {
            var error = new PluginError(PLUGIN_NAME, 'gulp-validatTypedoc: No Baseline found.');
            this.emit('error', error);
            cb();
            return;
        }

        var results = validate.getResults();
        var buffer = Buffer.from(JSON.stringify(results, null, 2))

        if (generateBaseLine) {
            fs.writeFileSync(validationBaselineFileName, buffer || '');
        }

        var jsFile = new Vinyl({
            base: null,
            path: validationBaselineFileName,
            contents: buffer
        });

        this.push(jsFile);

        var action = generateBaseLine ? "baseline generation" : "validation";
        var self = this;
        var error = function(message) {
            generateBaseLine ? warn : err;
            if (generateBaseLine) {
                warn(message);
            }
            else {
                err(message);
                var error = new PluginError(PLUGIN_NAME, message);
                self.emit('error', error);
            }
        }

        if (results.errors > 1) {
            var message = results.errors + " errors have been detected during the " + action + " !";
            error(message);
        }
        else if (results.errors === 1) {
            var message = "1 error has been detected during the " + action + " !";
            error(message);
        }
        else {
            var message = "All formatting check passed successfully during the " + action + " !";
            success(message);
        }

        cb();
    }

    return through.obj(bufferContents, endStream);
};

// exporting the plugin main function
module.exports = gulpValidateTypedoc;