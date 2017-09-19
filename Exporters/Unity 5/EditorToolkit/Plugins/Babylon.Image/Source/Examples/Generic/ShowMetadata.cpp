// ==========================================================
// Simple metadata reader
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

//
//  This example shows how to easily parse all metadata 
//  contained in a JPEG, TIFF or PNG image. 
//  Comments, Exif and IPTC/NAA metadata tags are written to a HTML file 
//  for later reading, and Adobe XMP XML packets are written 
//  in a file whose extension is '.xmp'. This file can be later 
//  processed using a XML parser. 
//
//  Metadata functions showed in this sample : 
//  FreeImage_GetMetadataCount, FreeImage_FindFirstMetadata, FreeImage_FindNextMetadata, 
//  FreeImage_FindCloseMetadata, FreeImage_TagToString, FreeImage_GetMetadata
//
// ==========================================================

#include <iostream>
#include <sstream>
#include <fstream>

using namespace std;

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
	cout << "\n*** ";
	if(fif != FIF_UNKNOWN) {
		cout << FreeImage_GetFormatFromFIF(fif) << " Format\n";
	}
	cout << message;
	cout << " ***\n";
}

// ----------------------------------------------------------

/**
Print a basic HTML header
*/
void PrintHTMLHeader(iostream& ios) {
	ios << "<HTML>\n<BODY>\n<CENTER>\n";
	ios << "<FONT FACE = \"Arial\">\n";
}

/**
Print a HTML footer
*/
void PrintHTMLFooter(iostream& ios) {
	ios << "</CENTER>\n</FONT>\n</BODY>\n</HTML>\n";
}

/**
Print a table header
*/
void PrintTableHeader(iostream& ios, const char *title) {
	ios << "<TABLE BORDER=\"1\">\n";
	ios << "<TR><TD ALIGN=CENTER COLSPAN=\"3\" BGCOLOR=\"#CCCCCC\"><B><font face=\"Arial\">" << title << "</font></B></TD></TR>\n";
}

/**
Print a table section
*/
void PrintTableSection(iostream& ios, const char *title) {
	ios << "<TR><TD ALIGN=CENTER COLSPAN=\"3\" BGCOLOR=\"#FFFFCC\"><B><font face=\"Arial\">" << title << "</font></B></TD></TR>\n";
	ios << "<TR><TD><B>Tag name</B></TD><TD><B>Tag value</B></TD><TD><B>Description</B></TD></TR>";
}

/**
Print a table footer
*/
void PrintTableFooter(iostream& ios) {
	ios << "</TABLE>\n";
}


/**
Print the metadata tags to a HTML file
*/
void PrintMetadata(iostream& ios, const char *sectionTitle, FIBITMAP *dib, FREE_IMAGE_MDMODEL model) {
	FITAG *tag = NULL;
	FIMETADATA *mdhandle = NULL;

	mdhandle = FreeImage_FindFirstMetadata(model, dib, &tag);

	if(mdhandle) {
		// Print a table section
		PrintTableSection(ios, sectionTitle);

		do {
			// convert the tag value to a string
			const char *value = FreeImage_TagToString(model, tag);

			// print the tag 
			// note that most tags do not have a description, 
			// especially when the metadata specifications are not available
			if(FreeImage_GetTagDescription(tag)) {
				ios << "<TR><TD>" << FreeImage_GetTagKey(tag) << "</TD><TD>" << value << "</TD><TD>" << FreeImage_GetTagDescription(tag) << "</TD></TR>\n";
			} else {
				ios << "<TR><TD>" << FreeImage_GetTagKey(tag) << "</TD><TD>" << value << "</TD><TD>" << "&nbsp;" << "</TD></TR>\n";
			}

		} while(FreeImage_FindNextMetadata(mdhandle, &tag));
	}

	FreeImage_FindCloseMetadata(mdhandle);
}

int 
main(int argc, char *argv[]) {
	unsigned count;

	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_Initialise();
#endif // FREEIMAGE_LIB

	// initialize your own FreeImage error handler

	FreeImage_SetOutputMessage(FreeImageErrorHandler);

	// print version & copyright infos

	cout << "FreeImage " << FreeImage_GetVersion() << "\n";
	cout << FreeImage_GetCopyrightMessage() << "\n\n";

	if(argc != 2) {
		cout << "Usage : ShowMetadata <input file name>\n";
		return 0;
	}

	// Load the bitmap

	FIBITMAP *dib = GenericLoader(argv[1], 0);
	if(!dib)
		return 0;

	// Create a HTML file
	std::string html_file(strtok(argv[1], ".") + std::string(".html"));

	fstream metadataFile(html_file.c_str(), ios::out);

	// Print the header

	PrintHTMLHeader(metadataFile);
	PrintTableHeader(metadataFile, argv[1]);

	// Parse and print metadata

	if(count = FreeImage_GetMetadataCount(FIMD_COMMENTS, dib)) {
		cout << "\nFIMD_COMMENTS (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "Comments", dib, FIMD_COMMENTS);
	}	
	if(count = FreeImage_GetMetadataCount(FIMD_EXIF_MAIN, dib)) {
		cout << "\nFIMD_EXIF_MAIN (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "Exif - main info", dib, FIMD_EXIF_MAIN);
	}
	if(count = FreeImage_GetMetadataCount(FIMD_EXIF_EXIF, dib)) {
		cout << "\nFIMD_EXIF_EXIF (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "Exif - advanced info", dib, FIMD_EXIF_EXIF);
	}
	if(count = FreeImage_GetMetadataCount(FIMD_EXIF_GPS, dib)) {
		cout << "\nFIMD_EXIF_GPS (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "Exif GPS", dib, FIMD_EXIF_GPS);
	}
	if(count = FreeImage_GetMetadataCount(FIMD_EXIF_INTEROP, dib)) {
		cout << "\nFIMD_EXIF_INTEROP (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "Exif interoperability", dib, FIMD_EXIF_INTEROP);
	}
	if(count = FreeImage_GetMetadataCount(FIMD_EXIF_MAKERNOTE, dib)) {
		cout << "\nFIMD_EXIF_MAKERNOTE (" << count << " data)\n-----------------------------------------\n";

		// Get the camera model
		FITAG *tagMake = NULL;
		FreeImage_GetMetadata(FIMD_EXIF_MAIN, dib, "Make", &tagMake);

		std::string buffer((char*)FreeImage_GetTagValue(tagMake));
		buffer += " Makernote";

		PrintMetadata(metadataFile, buffer.c_str(), dib, FIMD_EXIF_MAKERNOTE);
	}
	if(count = FreeImage_GetMetadataCount(FIMD_IPTC, dib)) {
		cout << "\nFIMD_IPTC (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "IPTC/NAA", dib, FIMD_IPTC);
	}
	if(count = FreeImage_GetMetadataCount(FIMD_GEOTIFF, dib)) {
		cout << "\nFIMD_GEOTIFF (" << count << " data)\n-----------------------------------------\n";

		PrintMetadata(metadataFile, "GEOTIFF", dib, FIMD_GEOTIFF);
	}

	// Print the footer

	PrintTableFooter(metadataFile);
	PrintHTMLFooter(metadataFile);

	// close the HTML file

	metadataFile.close();

	// print XMP data

	if(count = FreeImage_GetMetadataCount(FIMD_XMP, dib)) {
		cout << "\nFIMD_XMP (" << count << " packet)\n-----------------------------------------\n";

		std::string xmp_file(strtok(argv[1], ".") + std::string(".xmp"));
		metadataFile.open(xmp_file.c_str(), ios::out);

		FITAG *tag = NULL;
		FreeImage_GetMetadata(FIMD_XMP, dib, "XMLPacket", &tag);
		if(tag) {
			metadataFile << (char*)FreeImage_GetTagValue(tag);
		}

		metadataFile.close();
	}


	// Unload the bitmap

	FreeImage_Unload(dib);


	// call this ONLY when linking with FreeImage as a static library
#ifdef FREEIMAGE_LIB
	FreeImage_DeInitialise();
#endif // FREEIMAGE_LIB

	return 0;
}



