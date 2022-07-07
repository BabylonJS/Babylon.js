## What is Screen Reader?

[Screen reader](https://en.wikipedia.org/wiki/Screen_reader) is an assistive technology for blind or low vision people to interact with digital content. For users with blindness or low vision, they can't rely 100% on visual interface. Depending on the degree of visual disabilities, some of they don't even use a monitor display or mouse when they use computers. So, for this kind of user, they use screen reader, a software, to read what are displayed visually on the screen, through speech, or through braille output. They use keyboard to tell the screen reader what to read and interact with the computer. Here's an example video of how a user uses screen reader: [Screen Reader Demo - YouTube](https://www.youtube.com/watch?v=q_ATY9gimOM&ab_channel=SLCCUniversalAccess).

There are different screen reader applications that a user can choose, including OS built-in screen readers like Windows's "Narrator", MacOS and iOS's "VoiceOver", and 3-rd party screen readers like JAWS, NVDA.

Nowadays 2D pages on web generally have good accessibility support to screen reader users, because it can understand different HTML elements. But 3D applications like webGL applications is not. This is because objects in webGL applications are rendered in a <canvas> element. When screen reader read the page, it will only read: "*Image*", but can't interpret any objects inside the scene. If we do not deal with it correctly, users who are blind or low vision will have difficulty using the application.

The **Accessibility Package** provides a way to create the accessibility tree, which consists of HTML Twins for objects in the scene that should be accessible. Here's an example of a simple scene of three boxes using the Accessibility Package. If you turn on a screen reader to read the page, it will say "A big box in the middle of the scene. A small box on the left of the big box. A small box on the right of the big box".

// TODO: add playground

## How to use Accessibility Package to Support Screen Reader and Keyboard Navigation

### IAccessibilityTag

Blind or low vision users listen to the content and use keyboard to interact, so we need to add description to BabylonJS content that will be read by screen reader. You can add description to your Nodes or Controls (that you think should be accessible) by using **IAccessibilityTag**.

```javascript
let egg = BABYLON.MeshBuilder.CreateSphere("Egg", {diameterX: 0.62, diameterY: 0.8, diameterZ: 0.6}, scene);
egg.accessibilityTag = {
    description: "An easter egg"
}
```

Not all content in the scene should be accessible. For example, the decorative trees or background image on a UI panel. Only add IAccessibilityTag to the contents that's important to the user experience.

By default, all Controls (GUI) are considered "important" for accessibility, and will be rendered in accessibility tree with its own information (like text to show on a button), even you hasn't assigned the IAccessibility tag. But if you define the IAccessibilityTag, it can override default metadata (like assigning the IAccessibilityTag.description will override the text to show on a button). By default, Node type object are not considered "important", unless you assign a IAccessibilityTag to it.

### RenderAccessibilityTree()

The accessibility package basically generates HTML elements for your scene, based on the metadata (IAccessibilityTag) you added to your scene content. The screen reader then can read the HTML elements. To generate it for your scene:

```javascript
ACCESSIBILITY.AccessibilityRenderer.RenderAccessibilityTree(scene);
```

This will generate a `<div id="accessibility-tree">` HTML element right after the babylonJS scene's canvas element. Inside this div element, the renderer generate an HTML twin for each of your accessible contents in the scene. These HTML twin elements are internally connected with BabylonJS objects, so the screen reader user can also interact with the BabylonJS objects through their HTML twin.

### Interaction

Some of your contents in the scene might be interactable (e.g. clickable). For Node type objects, if you use BabylonJS's [ActionManager](https://doc.babylonjs.com/divingDeeper/events/actions) to define the interaction, the Accessibility package can automatically detects it and apply on the generated HTML twin elements, so that the user can use keyboard to trigger events like click or right click on the HTML twin elements, thus trigger the correspond action on the BabylonJS objects. Only ACTION_OnPickTrigger, ACTION_OnLeftPickTrigger, ACTION_OnRightPickTrigger are supported. For Control type objects, if you defined observer for onPointerClickObservable, the Accessibility package can also automatically detects it and apply on the generated HTML twin element.

If you want to customize the interaction, use the eventHandler field of IAccessibilityTag:

```javascript
let egg = BABYLON.MeshBuilder.CreateSphere("Egg", {diameterX: 0.62, diameterY: 0.8, diameterZ: 0.6}, scene);
egg.accessibilityTag = {
    description: "An easter egg",
    eventHandler: {
      "onclick": yourFunction
    }
}
```

// TODO: example of customize event handler

### When is AccessibilityTree Updated
Your scene might be not static, and you may want to update the accessibility tree when your scene is changed. The accessibility tree will automatically update when:

- A Node (Mesh or TransformNode) is added/removed in a scene;
- A Node (Mesh or TransformNode)'s enabled status is changed;
- A Control is added/removed from a Container;
- A Control's isVisible status is changed;
- A Node or Control's IAccessibilityTag is assigned or re-assigned;

// TODO: example of scene changing and update

### Customize HTML Twin with ARIA Attributes
If you are a pro in Web Accessibility, and know what you are doing, you can use IAccessibilityTag.role and IAccessibilityTag.aria to assign different [Role and ARIA attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) to the HTML Twin of this object to do whatevery you want.

```javascript
yourObject.accessibilityTag = {
    description: "An demo customized progressbar",
    role: "progressbar",
    aria: {
      "aria-valuemin": "0",
      "aria-valuemax": "100"
      "aria-valuenow": "0"
    }
}
```

Note that using ARIA attributes incorectly can introduce errors in your webpage. While ARIA is designed to make web pages more accessible, if used incorrectly, it can do more harm than good. If you choose to use ARIA, you are responsible for mimicking the equivalent browser behavior in script.
