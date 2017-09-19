// ==========================================================
// Plugin functions demonstration
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

// This example shows how to use Plugin functions to explore FreeImage capabilities. 
// Whenever an external plugin is added to the library, it is automatically loaded 
// with FreeImage and can be asked for its capabilities via the plugin functions.
// 
// Functions used in this sample : 
// FreeImage_FIFSupportsExportBPP, FreeImage_FIFSupportsICCProfiles, FreeImage_FIFSupportsReading, 
// FreeImage_FIFSupportsWriting, FreeImage_GetFIFCount, FreeImage_GetFIFDescription, 
// FreeImage_GetFIFExtensionList, FreeImage_GetFormatFromFIF, 
// FreeImage_GetVersion, FreeImage_GetCopyrightMessage, FreeImage_SetOutputMessage
//
// ==========================================================

#include <iostream.h>
#include <fstream.h>
#include <stdio.h>
#include <string.h>

#include "FreeImage.h"

// ----------------------------------------------------------

/**
	FreeImage error handler
*/
void MyMessageFunc(FREE_IMAGE_FORMAT fif, const char *message) {
	cout << "\n*** " << message << " ***\n";
}

// ----------------------------------------------------------

/**
	Print plugins import capabilities
*/
void PrintImportFormats(iostream& ios) {
	int count = FreeImage_GetFIFCount();
	if(count)
		ios << "FORMAT;DESCRIPTION;EXTENSIONS;ICC PROFILES\n";
	for(int i = 0; i < count; i++) {
		FREE_IMAGE_FORMAT fif = (FREE_IMAGE_FORMAT)i;

		if(FreeImage_FIFSupportsReading(fif)) {
			const char * format = FreeImage_GetFormatFromFIF(fif);
			const char * description = FreeImage_GetFIFDescription(fif);
			const char * ext = FreeImage_GetFIFExtensionList(fif);
			const char * icc = "*";
			if(FreeImage_FIFSupportsICCProfiles(fif)) {
				ios << format << ";" << description << ";" << ext << ";" << icc << "\n";
			} else {
				ios << format << ";" << description << ";" << ext << "; \n";
			}
		}
	}
}

/**
	Print plugins export capabilities
*/
void PrintExportFormats(iostream& ios) {
	int count = FreeImage_GetFIFCount();
	if(count)
		ios << "FORMAT;DESCRIPTION;EXTENSIONS;BITDEPTH;ICC PROFILES\n";
	for(int i = 0; i < count; i++) {
		FREE_IMAGE_FORMAT fif = (FREE_IMAGE_FORMAT)i;

		if(FreeImage_FIFSupportsWriting(fif)) {
			const char * format = FreeImage_GetFormatFromFIF(fif);
			const char * description = FreeImage_GetFIFDescription(fif);
			const char * ext = FreeImage_GetFIFExtensionList(fif);
			const char * icc = "*";

			ios << format << ";" << description << ";" << ext << ";";
			if(FreeImage_FIFSupportsExportBPP(fif, 1))
				ios << "1 ";
			if(FreeImage_FIFSupportsExportBPP(fif, 4))
				ios << "4 ";
			if(FreeImage_FIFSupportsExportBPP(fif, 8))
				ios << "8 ";
			if(FreeImage_FIFSupportsExportBPP(fif, 16))
				ios << "16 ";
			if(FreeImage_FIFSupportsExportBPP(fif, 24))
				ios << "24 ";
			if(FreeImage_FIFSupportsExportBPP(fif, 32))
				ios << "32 ";
			if(FreeImage_FIFSupportsICCProfiles(fif)) {
				ios << ";" << icc;
			} else {
				ios << "; ";
			}
			ios << "\n";
		}
	}
}

int 
main(int argc, char *argv[]) {
	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_Initialise();
#endif // FREEIMAGE_LIB

	// initialize FreeImage error handler

	FreeImage_SetOutputMessage(MyMessageFunc);

	// print version & copyright infos

	cout << "FreeImage " << FreeImage_GetVersion() << "\n";
	cout << FreeImage_GetCopyrightMessage() << "\n\n";

	// Print input formats (including external plugins) known by the library
	fstream importFile("fif_import.csv", ios::out);
	PrintImportFormats(importFile);
	importFile.close();

	// Print output formats (including plugins) known by the library
	// for each export format, supported bitdepths are given
	fstream exportFile("fif_export.csv", ios::out);
	PrintExportFormats(exportFile);
	exportFile.close();

	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_DeInitialise();
#endif // FREEIMAGE_LIB

	return 0;

}
