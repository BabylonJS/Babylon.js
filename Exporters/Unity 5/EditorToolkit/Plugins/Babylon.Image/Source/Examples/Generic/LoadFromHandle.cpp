// ==========================================================
// Load From Handle Example
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

//   This example shows how to load a bitmap from a
//   user allocated FILE pointer.
// 
// Functions used in this sample : 
// FreeImage_GetFormatFromFIF, FreeImage_GetFileTypeFromHandle, FreeImage_LoadFromHandle, 
// FreeImage_GetFIFFromFilename, FreeImage_Save, FreeImage_Unload
// FreeImage_GetVersion, FreeImage_GetCopyrightMessage, FreeImage_SetOutputMessage
//
// ==========================================================

#include <assert.h>
#include <stdio.h>
#include <stdlib.h>

#include "FreeImage.h"

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

unsigned DLL_CALLCONV
myReadProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
	return fread(buffer, size, count, (FILE *)handle);
}

unsigned DLL_CALLCONV
myWriteProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
	return fwrite(buffer, size, count, (FILE *)handle);
}

int DLL_CALLCONV
mySeekProc(fi_handle handle, long offset, int origin) {
	return fseek((FILE *)handle, offset, origin);
}

long DLL_CALLCONV
myTellProc(fi_handle handle) {
	return ftell((FILE *)handle);
}

// ----------------------------------------------------------

int 
main(int argc, char *argv[]) {
	
	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_Initialise();
#endif // FREEIMAGE_LIB

	// initialize your own FreeImage error handler

	FreeImage_SetOutputMessage(FreeImageErrorHandler);

	// print version & copyright infos

	printf(FreeImage_GetVersion());
	printf("\n");
	printf(FreeImage_GetCopyrightMessage());
	printf("\n");


	if(argc != 2) {
		printf("Usage : LoadFromHandle <input file name>\n");
		return 0;
	}

	// initialize your own IO functions

	FreeImageIO io;

	io.read_proc  = myReadProc;
	io.write_proc = myWriteProc;
	io.seek_proc  = mySeekProc;
	io.tell_proc  = myTellProc;

	FILE *file = fopen(argv[1], "rb");

	if (file != NULL) {
		// find the buffer format
		FREE_IMAGE_FORMAT fif = FreeImage_GetFileTypeFromHandle(&io, (fi_handle)file, 0);

		if(fif != FIF_UNKNOWN) {
			// load from the file handle
			FIBITMAP *dib = FreeImage_LoadFromHandle(fif, &io, (fi_handle)file, 0);

			// save the bitmap as a PNG ...
			const char *output_filename = "test.png";

			// first, check the output format from the file name or file extension
			FREE_IMAGE_FORMAT out_fif = FreeImage_GetFIFFromFilename(output_filename);

			if(out_fif != FIF_UNKNOWN) {
				// then save the file
				FreeImage_Save(out_fif, dib, output_filename, 0);
			}

			// free the loaded FIBITMAP
			FreeImage_Unload(dib);
		}
		fclose(file);
	}

	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_DeInitialise();
#endif // FREEIMAGE_LIB

	return 0;
}
