// ==========================================================
// Multipage functions demonstration
//
// Design and implementation by 
// - Hervé Drolon
//
// This file is part of FreeImage 3
//
// COVERED CODE IS PROVIDED UNDER THIS LICENSE ON AN "AS IS" BASIS, WITHOUT WARRANTY
// OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, WITHOUT LIMITATION, WARRANTIES
// THAT THE COVERED CODE IS FREE OF DEFECTS, MERCHANTABLE, FIT FOR A PARTICULAR PURPOSE
// OR NON-INFRINGING. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE COVERED
// CODE IS WITH YOU. SHOULD ANY COVERED CODE PROVE DEFECTIVE IN ANY RESPECT, YOU (NOT
// THE INITIAL DEVELOPER OR ANY OTHER CONTRIBUTOR) ASSUME THE COST OF ANY NECESSARY
// SERVICING, REPAIR OR CORRECTION. THIS DISCLAIMER OF WARRANTY CONSTITUTES AN ESSENTIAL
// PART OF THIS LICENSE. NO USE OF ANY COVERED CODE IS AUTHORIZED HEREUNDER EXCEPT UNDER
// THIS DISCLAIMER.
//
// Use at own risk!
// ==========================================================

// This sample shows how to clone a multipage TIFF
//
// Functions used in this sample : 
// FreeImage_OpenMultiBitmap, FreeImage_GetPageCount, FreeImage_LockPage, 
// FreeImage_AppendPage, FreeImage_UnlockPage, FreeImage_CloseMultiBitmap; 
// FreeImage_SetOutputMessage
//
// ==========================================================

#include <iostream.h>
#include <stdio.h>
#include <string.h>

#include "FreeImage.h"

// ----------------------------------------------------------

/**
	FreeImage error handler
*/
void MyMessageFunc(FREE_IMAGE_FORMAT fif, const char *message) {
	cout << "\n*** " << message << " ***\n";
	cout.flush();
}

// ----------------------------------------------------------

bool CloneMultiPage(FREE_IMAGE_FORMAT fif, char *input, char *output, int output_flag) {

	BOOL bMemoryCache = TRUE;

	// Open src file (read-only, use memory cache)
	FIMULTIBITMAP *src = FreeImage_OpenMultiBitmap(fif, input, FALSE, TRUE, bMemoryCache);

	if(src) {
		// Open dst file (creation, use memory cache)
		FIMULTIBITMAP *dst = FreeImage_OpenMultiBitmap(fif, output, TRUE, FALSE, bMemoryCache);

		// Get src page count
		int count = FreeImage_GetPageCount(src);

		// Clone src to dst
		for(int page = 0; page < count; page++) {
			// Load the bitmap at position 'page'
			FIBITMAP *dib = FreeImage_LockPage(src, page);
			if(dib) {
				// add a new bitmap to dst
				FreeImage_AppendPage(dst, dib);
				// Unload the bitmap (do not apply any change to src)
				FreeImage_UnlockPage(src, dib, FALSE);
			}
		}

		// Close src
		FreeImage_CloseMultiBitmap(src, 0);
		// Save and close dst
		FreeImage_CloseMultiBitmap(dst, output_flag);

		return true;
	}

	return false;
}


int 
main(int argc, char *argv[]) {

	char *input_filename = "images\\input.tif";
	char *output_filename = "images\\clone.tif";

	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_Initialise();
#endif // FREEIMAGE_LIB

	// initialize our own FreeImage error handler

	FreeImage_SetOutputMessage(MyMessageFunc);

	// Copy 'input.tif' to 'clone.tif'

	CloneMultiPage(FIF_TIFF, input_filename, output_filename, 0);

	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_DeInitialise();
#endif // FREEIMAGE_LIB

	return 0;
}
