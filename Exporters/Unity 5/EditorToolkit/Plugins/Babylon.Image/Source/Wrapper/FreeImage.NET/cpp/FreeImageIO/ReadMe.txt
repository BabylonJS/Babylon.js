========================================================================
FreeImageIO.Net 

Author: Marcos Pernambuco Motta (marcos.pernambuco@gmail.com)
========================================================================

This library allows programs that use FreeImage.Net to save images to or 
to load images from .Net Streams.

The class FreeImageStream implements a FreeImageIO handler and routes
IO calls (read,write,tell and seek) to a wrapped System.IO.Stream.

Example:

using FreeImageAPI;
using FreeImageIODotNet;

uint dib = FreeImageAPI.FreeImage.Allocate(width,height,32,0,0,0);

// ...  Image handling code goes here

System.IO.FileStream stream = new System.IO.FileStream(@"c:\sample.png",System.IO.FileMode.Create);
FreeImageStream imageStream = new FreeImageStream(stream);
imageStream.SaveImage((int)FREE_IMAGE_FORMAT.FIF_PNG,dib,0);
stream.Close();

Compile with VS2003.
