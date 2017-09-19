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

// --------------------------------------------------------------------------
// Multipage test scripts

BOOL testCloneMultiPage(const char *input, const char *output, int output_flag) {
	BOOL bSuccess = FALSE;
	BOOL bMemoryCache = TRUE;

	fipMultiPage src(bMemoryCache);
	fipMultiPage dst(bMemoryCache);

	// You MUST declare this before using it. 
	// We will use the assignement operator, i.e. operator=()
	fipImage image;

	// Open src file (read-only, use memory cache)
	bSuccess = src.open(input, FALSE, TRUE);
	assert(bSuccess);

	if(src.isValid()) {
		// Open dst file (creation, use memory cache)
		bSuccess = dst.open(output, TRUE, FALSE);
		assert(bSuccess);

		// Get src page count
		int count = src.getPageCount();

		// Clone src to dst
		for(int page = 0; page < count; page++) {
			// Load the bitmap at position 'page'
			image = src.lockPage(page);
			if(image.isValid()) {
				// add a new bitmap to dst
				dst.appendPage(image);
				// Unload the bitmap (do not apply any change to src)
				src.unlockPage(image, FALSE);
			}
		}

		// Close src
		bSuccess = src.close(0);
		assert(bSuccess);

		// Save and close dst
		bSuccess = dst.close(output_flag);
		assert(bSuccess);

		return TRUE;
	}

	return FALSE;
}

// ----------------------------------------------------------

void testMultiPage(const char *lpszMultiPage) {
	cout << "testMultiPage ...\n";

	testCloneMultiPage(lpszMultiPage, "clone.tif", 0);
}


