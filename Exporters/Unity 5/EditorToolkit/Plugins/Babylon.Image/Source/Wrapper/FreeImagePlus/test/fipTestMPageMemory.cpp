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

static BOOL  
loadBuffer(const char *lpszPathName, BYTE **buffer, DWORD *length) {
	struct stat file_info;
	int result;

	// get data associated with lpszPathName
	result = stat(lpszPathName, &file_info);
	assert(result == 0);
	if(result == 0) {
		// allocate a memory buffer and load temporary data
		*buffer = (BYTE*)malloc(file_info.st_size * sizeof(BYTE));
		if(*buffer) {
			FILE *stream = fopen(lpszPathName, "rb");
			if(stream) {
				*length = (DWORD)fread(*buffer, sizeof(BYTE), file_info.st_size, stream);
				fclose(stream);
				
				return TRUE;
			}
		}
	}

	return FALSE;
}

static BOOL 
extractPagesFromMemory(FREE_IMAGE_FORMAT fif, fipMemoryIO& memIO) {
	BOOL bMemoryCache = TRUE;

	char filename[256];
	fipImage image;

	// open the multipage bitmap stream as read-only
	fipMultiPage src(bMemoryCache);

	src.open(memIO);

	if(src.isValid()) {
		// get the page count
		int count = src.getPageCount();
		// extract all pages
		for(int page = 0; page < count; page++) {
			// load the bitmap at position 'page'
			image = src.lockPage(page);
			if(image.isValid()) {
				// save the page
				sprintf(filename, "page%d.%s", page, FreeImage_GetFormatFromFIF(fif));
				image.save(filename, 0);
				// Unload the bitmap (do not apply any change to src)
				src.unlockPage(image, FALSE);
			} else {
				// an error occured: free the multipage bitmap handle (fipMultiPage destructor) and return
				src.close(0);
				return FALSE;
			}
		}
	}
	// make sure to close the multipage bitmap handle on exit (fipMultiPage destructor or direct call to src.close(0))
	return src.close(0);
}

BOOL testLoadMultiBitmapFromMemory(const char *lpszPathName) {
	BOOL bSuccess = FALSE;

	BYTE *buffer = NULL;
	DWORD buffer_size = 0;

	// load source stream as a buffer, i.e. 
	// allocate a memory buffer and load temporary data
	bSuccess = loadBuffer(lpszPathName, &buffer, &buffer_size);
	assert(bSuccess);

	if(bSuccess) {
		// attach the binary data to a memory stream
		fipMemoryIO memIO(buffer, buffer_size);

		// get the file type
		FREE_IMAGE_FORMAT fif = memIO.getFileType();

		// extract pages
		bSuccess = extractPagesFromMemory(fif, memIO);
		assert(bSuccess);

		// close the memory stream (memIO destructor)
	}

	// user is responsible for freeing the data
	free(buffer);

	return bSuccess;
}

// --------------------------------------------------------------------------

BOOL testSaveMultiBitmapToMemory(const char *input, const char *output, int output_flag) {
	BOOL bSuccess;

	BOOL bCreateNew = FALSE;
	BOOL bReadOnly = TRUE;
	BOOL bMemoryCache = TRUE;

	// Open src file (read-only, use memory cache)
	fipMultiPage src(bMemoryCache);
	src.open(input, bCreateNew, bReadOnly, 0);

	if(src.isValid()) {
		// open and allocate a memory stream
		fipMemoryIO memIO;
		
		// save the file to memory
		FREE_IMAGE_FORMAT fif = fipImage::identifyFIF(output);
		bSuccess = src.saveToMemory(fif, memIO, output_flag);
		assert(bSuccess);

		// src is no longer needed: close and free src file
		src.close(0);

		// get the buffer from the memory stream
		BYTE *mem_buffer = NULL;
		DWORD size_in_bytes = 0;

		bSuccess = memIO.acquire(&mem_buffer, &size_in_bytes);
		assert(bSuccess);

		// save the buffer in a file stream
		FILE *stream = fopen(output, "wb");
		if(stream) {
			fwrite(mem_buffer, sizeof(BYTE), size_in_bytes, stream);
			fclose(stream);
		}
		
		// close and free the memory stream (memIO destructor)
		
		return TRUE;
	}

	return FALSE;
}

BOOL testMemoryStreamMultiPageOpenSave(const char *lpszPathName, char *output, int input_flag, int output_flag) {
	BOOL bSuccess = FALSE;

	BYTE *buffer = NULL;
	DWORD buffer_size = 0;

	// load source stream as a buffer, i.e. 
	// allocate a memory buffer and load temporary data
	bSuccess = loadBuffer(lpszPathName, &buffer, &buffer_size);
	assert(bSuccess);

	// attach the binary data to a memory stream
	fipMemoryIO src_stream(buffer, buffer_size);
	assert(src_stream.isValid());

	// open the multipage bitmap stream
	fipMultiPage src;
	src.open(src_stream, input_flag);

	// apply some modifications (everything being stored to the cache) ...

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
	}

	// save the modification into the output stream ...

	if(src.isValid()) {
		// open and allocate a memory stream
		fipMemoryIO dst_stream;
		assert(dst_stream.isValid());
		
		// save the file to memory
		FREE_IMAGE_FORMAT fif = fipImage::identifyFIF(output);
		src.saveToMemory(fif, dst_stream, output_flag);

		// src is no longer needed
		// close and free the memory stream
		src_stream.close();
		// close and free src file (nothing is done, the cache is cleared)
		src.close(0);

		// at this point, the input buffer is no longer needed
		// !!! user is responsible for freeing the initial source buffer !!!
		free(buffer); buffer = NULL;
		
		// get the dst buffer from the memory stream
		BYTE *dst_buffer = NULL;
		DWORD size_in_bytes = 0;
		
		dst_stream.acquire(&dst_buffer, &size_in_bytes);
		
		// save the buffer in a file stream
		FILE *stream = fopen(output, "wb");
		if(stream) {
			fwrite(dst_buffer, sizeof(BYTE), size_in_bytes, stream);
			fclose(stream);
		}
		
		// close and free the memory stream (destructor is called)

		return TRUE;
	}

	if(buffer) {
		free(buffer);
	}

	return FALSE;
}

// --------------------------------------------------------------------------

void testMultiPageMemory(const char *lpszPathName) {
	BOOL bSuccess;

	cout << "testMultiPageMemory ...\n";
	
	// test FreeImage_LoadMultiBitmapFromMemory
	bSuccess = testLoadMultiBitmapFromMemory(lpszPathName);
	assert(bSuccess);

	// test FreeImage_SaveMultiBitmapToMemory
	bSuccess = testSaveMultiBitmapToMemory(lpszPathName, "mpage-mstream.tif", 0);
	assert(bSuccess);

	// test FreeImage_LoadMultiBitmapFromMemory & FreeImage_SaveMultiBitmapToMemory
	bSuccess = testMemoryStreamMultiPageOpenSave(lpszPathName, "mpage-mstream-redirect.tif", 0, 0);
	assert(bSuccess);

}
