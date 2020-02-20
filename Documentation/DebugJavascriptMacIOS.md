You can debug your Javascript program running in BabylonNative for MacOS or iOS using Safari. These simple steps will show you how you can hook the Safari debugger to your Javascriptcore Context.

# Enable Developer options in Safari

Run Safari, got to the preferences:

![DebugMac](Images/SafariGoPrefs.png)

Click the Advanced tab and enable developer options

![DebugMac](Images/SafariCheckDeveloper.png)

# Hooking Javascriptcore Context

Run your playground.

![DebugMac](Images/DebugMacRunPG.png)

In Safari, in the develop menu, you should see your app and the context.

![DebugMac](Images/HookJSCContext.png)

Check everything is properly connected by break the app in the debugger. You should see your scripts and all the details.

![DebugMac](Images/JSCDebugBreakApp.png)