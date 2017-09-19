// ==========================================================
// Alpha channel manipulation example
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

//   This example shows how to create a transparent image from any input image
//   using the greyscale version of the input image as the alpha channel mask.
//   The alpha channel is set using the FreeImage_SetChannel function.
// 
//
// ==========================================================

#include <stdio.h>
#include "FreeImage.h"

// ----------------------------------------------------------

/** Generic image loader
	@param lpszPathName Pointer to the full file name
	@param flag Optional load flag constant
	@return Returns the loaded dib if successful, returns NULL otherwise
*/
FIBITMAP* GenericLoader(const char* lpszPathName, int flag) {
	FREE_IMAGE_FORMAT fif = FIF_UNKNOWN;

	// check the file signature and deduce its format
	// (the second argument is currently not used by FreeImage)
	fif = FreeImage_GetFileType(lpszPathName, 0);
	if(fif == FIF_UNKNOWN) {
		// no signature ?
		// try to guess the file format from the file extension
		fif = FreeImage_GetFIFFromFilename(lpszPathName);
	}
	// check that the plugin has reading capabilities ...
	if((fif != FIF_UNKNOWN) && FreeImage_FIFSupportsReading(fif)) {
		// ok, let's load the file
		FIBITMAP *dib = FreeImage_Load(fif, lpszPathName, flag);
		// unless a bad file format, we are done !
		return dib;
	}
	return NULL;
}

/** Generic image writer
	@param dib Pointer to the dib to be saved
	@param lpszPathName Pointer to the full file name
	@param flag Optional save flag constant
	@return Returns true if successful, returns false otherwise
*/
bool GenericWriter(FIBITMAP* dib, const char* lpszPathName, int flag) {
	FREE_IMAGE_FORMAT fif = FIF_UNKNOWN;
	BOOL bSuccess = FALSE;

	if(dib) {
		// try to guess the file format from the file extension
		fif = FreeImage_GetFIFFromFilename(lpszPathName);
		if(fif != FIF_UNKNOWN ) {
			// check that the plugin has sufficient writing and export capabilities ...
			WORD bpp = FreeImage_GetBPP(dib);
			if(FreeImage_FIFSupportsWriting(fif) && FreeImage_FIFSupportsExportBPP(fif, bpp)) {
				// ok, we can save the file
				bSuccess = FreeImage_Save(fif, dib, lpszPathName, flag);
				// unless an abnormal bug, we are done !
			}
		}
	}
	return (bSuccess == TRUE) ? true : false;
}

// ----------------------------------------------------------

/**
	FreeImage error handler
	@param fif Format / Plugin responsible for the error 
	@param message Error message
*/
void FreeImageErrorHandler(FREE_IMAGE_FORMAT fif, const char *message) {
	printf("\n*** "); 
	if(fif != FIF_UNKNOWN) {
		printf("%s Format\n", FreeImage_GetFormatFromFIF(fif));
	}
	printf(message);
	printf(" ***\n");
}

// ----------------------------------------------------------


/**
 Creates a 32-bit transparent image using the black channel of the source image
 @param src Source image
 @return Returns a 32-bit transparent image
*/
FIBITMAP* CreateAlphaFromLightness(FIBITMAP *src) {
	// create a 32-bit image from the source
	FIBITMAP *dst = FreeImage_ConvertTo32Bits(src);

	// create a 8-bit mask
	FreeImage_Invert(src);
	FIBITMAP *mask = FreeImage_ConvertTo8Bits(src);
	FreeImage_Invert(src);

	// insert the mask as an alpha channel
	FreeImage_SetChannel(dst, mask, FICC_ALPHA);

	// free the mask and return
	FreeImage_Unload(mask);

	return dst;
}

int 
main(int argc, char *argv[]) {
	
	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_Initialise();
#endif // FREEIMAGE_LIB

	// initialize your own FreeImage error handler

	FreeImage_SetOutputMessage(FreeImageErrorHandler);

	// print version & copyright infos

	printf("FreeImage version : %s", FreeImage_GetVersion());
	printf("\n");
	printf(FreeImage_GetCopyrightMessage());
	printf("\n");


	if(argc != 3) {
		printf("Usage : CreateAlpha <input file name> <output file name>\n");
		return 0;
	}

	// Load the source image
	FIBITMAP *src = GenericLoader(argv[1], 0);
	if(src) {
		// Create a transparent image from the lightness image of src
		FIBITMAP *dst = CreateAlphaFromLightness(src);

		if(dst) {
			// Save the destination image
			bool bSuccess = GenericWriter(dst, argv[2], 0);
			if(!bSuccess) {
				printf("\nUnable to save %s file", argv[2]);
				printf("\nThis format does not support 32-bit images");
			}

			// Free dst
			FreeImage_Unload(dst);
		}

		// Free src
		FreeImage_Unload(src);
	}

	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_DeInitialise();
#endif // FREEIMAGE_LIB

	return 0;
}
