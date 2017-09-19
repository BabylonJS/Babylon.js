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

static unsigned DLL_CALLCONV
myReadProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
	return fread(buffer, size, count, (FILE *)handle);
}

static unsigned DLL_CALLCONV
myWriteProc(void *buffer, unsigned size, unsigned count, fi_handle handle) {
	return fwrite(buffer, size, count, (FILE *)handle);
}

static int DLL_CALLCONV
mySeekProc(fi_handle handle, long offset, int origin) {
	return fseek((FILE *)handle, offset, origin);
}

static long DLL_CALLCONV
myTellProc(fi_handle handle) {
	return ftell((FILE *)handle);
}

BOOL testStreamMultiPageOpen(const char *input, int flags) {
	// initialize your own IO functions

	FreeImageIO io;

	io.read_proc  = myReadProc;
	io.write_proc = myWriteProc;
	io.seek_proc  = mySeekProc;
	io.tell_proc  = myTellProc;

	BOOL bSuccess = FALSE;

	// Open src stream in read-only mode
	FILE *file = fopen(input, "r+b");	
	if (file != NULL) {
		fipMultiPage src;

		// Open the multi-page file
		src.open(&io, (fi_handle)file, flags);

		if(src.isValid()) {
			// get the page count
			int count = src.getPageCount();
			assert(count > 1);

			// delete page 0 (modifications are stored to the cache)
			src.deletePage(0);

			// Close src file (nothing is done, the cache is cleared)
			bSuccess = src.close(0);
			assert(bSuccess);
		}

		// Close the src stream
		fclose(file);

		return bSuccess;
	}
		
	return bSuccess;
}

BOOL testStreamMultiPageSave(const char *input, const char *output, int input_flag, int output_flag) {
	// initialize your own IO functions

	FreeImageIO io;

	io.read_proc  = myReadProc;
	io.write_proc = myWriteProc;
	io.seek_proc  = mySeekProc;
	io.tell_proc  = myTellProc;

	BOOL bCreateNew = FALSE;
	BOOL bReadOnly = TRUE;
	BOOL bMemoryCache = TRUE;

	// Open src file (read-only, use memory cache)
	fipMultiPage src(bMemoryCache);
	src.open(input, bCreateNew, bReadOnly, input_flag);
	
	if(src.isValid()) {
		// Open dst stream in read/write mode
		FILE *file = fopen(output, "w+b");	
		if (file != NULL) {
			// Save the multi-page file to the stream
			FREE_IMAGE_FORMAT fif = fipImage::identifyFIF(output);
			BOOL bSuccess = src.saveToHandle(fif, &io, (fi_handle)file, output_flag);
			assert(bSuccess);

			// Close the dst stream
			fclose(file);

			// Close src file (or let the destructor close it)
			return src.close(0);

			return TRUE;
		}
		
		// Close src file (or let the destructor close it)
		src.close(0);
	}

	return FALSE;
}

BOOL testStreamMultiPageOpenSave(const char *input, const char *output, int input_flag, int output_flag) {
	// initialize your own IO functions

	FreeImageIO io;

	io.read_proc  = myReadProc;
	io.write_proc = myWriteProc;
	io.seek_proc  = mySeekProc;
	io.tell_proc  = myTellProc;

	BOOL bSuccess = FALSE;

	// Open src stream in read-only mode
	FILE *src_file = fopen(input, "r+b");
	assert(src_file);
	if (src_file != NULL) {
		fipMultiPage src;
		// Open the multi-page file
		src.open(&io, (fi_handle)src_file, input_flag);

		if(src.isValid()) {
			fipImage image;

			// get the page count
			int count = src.getPageCount();
			assert(count > 2);

			// Load the bitmap at position '2'
			image = src.lockPage(2);
			if(image.isValid()) {
				image.invert();
				// Unload the bitmap (apply change to src, modifications are stored to the cache)
				src.unlockPage(image, TRUE);
			}

			// delete page 0 (modifications are stored to the cache)
			src.deletePage(0);

			// insert a new page at position '0' (modifications are stored to the cache)
			image.load("test.jpg");
			src.insertPage(0, image);

			// Open dst stream in read/write mode
			FILE *dst_file = fopen(output, "w+b");	
			assert(dst_file);
			if (dst_file != NULL) {
				// Save the multi-page file to the stream (modifications are applied)
				FREE_IMAGE_FORMAT fif = fipImage::identifyFIF(output);
				BOOL bSuccess = src.saveToHandle(fif, &io, (fi_handle)dst_file, output_flag);
				assert(bSuccess);

				// Close the dst stream
				fclose(dst_file);
			}

			// Close src file (nothing is done, the cache is cleared)
			bSuccess = src.close(0);
			assert(bSuccess);
		}

		// Close the src stream
		fclose(src_file);

		return bSuccess;
	}

	return FALSE;
}

// --------------------------------------------------------------------------

void testStreamMultiPage(const char *lpszPathName) {
	BOOL bSuccess;
	
	cout << "testStreamMultiPage ...\n";

	// test multipage stream (opening)
	bSuccess = testStreamMultiPageOpen(lpszPathName, 0);
	assert(bSuccess);

	// test multipage stream (save as)
	bSuccess = testStreamMultiPageSave(lpszPathName, "clone-stream.tif", 0, 0);
	assert(bSuccess);
	
	// test multipage stream (open, modify, save as)
	bSuccess = testStreamMultiPageOpenSave(lpszPathName, "redirect-stream.tif", 0, 0);
	assert(bSuccess);

}
