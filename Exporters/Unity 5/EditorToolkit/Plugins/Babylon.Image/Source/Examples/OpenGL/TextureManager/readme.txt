Hello everyone, this is my 2D texture manager class for OpenGL using the FreeImage Library.  

Requirements:
--------------------
OpenGL
STL map class
FreeImage (included)


Usage
--------------------
To load a texture, simply call the LoadTexture function:

TextureManager::Inst()->LoadTexture("img\\bg.jpg", BACKGROUND_IMAGE_ID);

This also binds the loaded texture as the current texture, so after calling it you may make any calls to glTexParameter you may need to specify the properties of the texture.

When you are rendering, just call the TextureManager's BindImage function instead of glBindImage:

TextureManager::Inst()->BindImage(BACKGROUND_IMAGE_ID);

and then do your rendering as normal.
--------------------


Feel free to distribute this as you like, but mind the FreeImage licence included in license-fi.txt, and please don't take credit for my code.  If you modify it, be sure to mention me (Ben English) somewhere.

Please send any comments or suggestions to me at benjamin.english@oit.edu


Thanks to Herve Drolon for the FreeImage library, I've found it to be very useful!