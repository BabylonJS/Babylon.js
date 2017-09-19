// ==========================================================
// FreeImagePlus Test Script
//
// Design and implementation by
// - Hervé Drolon (drolon@infonie.fr)
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
// Use at your own risk!
// ==========================================================


#include "fipTest.h"

using namespace std;

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

int main(int argc, char *argv[]) {
	char *lpszTestFile = "test.jpg";
	char *lpszMultiPage = "test.tif";

#if defined(FREEIMAGE_LIB) || !defined(WIN32)
	FreeImage_Initialise();
#endif

	// initialize our own FreeImage error handler

	FreeImage_SetOutputMessage(FreeImageErrorHandler);

	// test memory IO
	testMemIO(lpszTestFile);

	// test multipage IO
	testMultiPage(lpszMultiPage);

	// test multipage memory IO
	testMultiPageMemory(lpszMultiPage);

	// test multipage stream IO
	testStreamMultiPage(lpszMultiPage);

#if defined(FREEIMAGE_LIB) || !defined(WIN32)
	FreeImage_DeInitialise();
#endif

	return 0;
}


