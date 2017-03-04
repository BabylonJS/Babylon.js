=========================================
BabylonJS: Maya Art Tools
=========================================
1. Install Maya art tool scripts (.mel) in your scripts folder.
   
   Window Folder:
   C:\Users\USERNAME\Documents\maya\*VERSION*\scripts
   
   Macintosh Folder:
   ~/Library/Preferences/Autodesk/maya/*VERSION*/scripts


===========================
Add Namespace Tool To Shelf
===========================
*** Usage: Remove Unwanted Namespace From All Objects
1. In Maya open the Script Editor and go to the Mel tab, copy and paste command below:
########################

babylonNameTool();

########################
2. Highlight it and click on "Save Script to Shelf...", specify a name ('Names') and click "OK".


========================
Add Reskin Tool To Shelf
========================
*** Usage: Reskin and combine selected meshes with new max influencers.
1. In Maya open the Script Editor and go to the Mel tab, copy and paste command below:
########################

babylonReskinTool();

########################
2. Highlight it and click on "Save Script to Shelf...", specify a name ('Reskin') and click "OK".