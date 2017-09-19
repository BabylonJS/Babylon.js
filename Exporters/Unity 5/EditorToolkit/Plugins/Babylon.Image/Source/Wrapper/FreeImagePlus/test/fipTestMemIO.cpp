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
// Memory IO test scripts

/**
Test saving to a memory stream
*/
void testSaveMemIO(const char *lpszPathName) {
	BOOL bSuccess = FALSE;

	// load a regular file
	FREE_IMAGE_FORMAT fif = FreeImage_GetFileType(lpszPathName);
	FIBITMAP *dib = FreeImage_Load(fif, lpszPathName, 0);
	
	// open a memory handle
	fipMemoryIO memIO;

	// save the file to memory
	bSuccess = memIO.save(fif, dib, 0);
	assert(bSuccess == TRUE);

	// at this point, memIO contains the entire PNG data in memory. 
	// the amount of space used by the memory is equal to file_size	
	long file_size = memIO.tell();
	assert(file_size != 0);

	// its easy load an image from memory as well

	// seek to the start of the memory stream
	memIO.seek(0L, SEEK_SET);
	
	// get the file type	
	FREE_IMAGE_FORMAT mem_fif = memIO.getFileType();
	
	// load an image from the memory handle 	
	FIBITMAP *check = memIO.load(mem_fif, 0);
	assert(check != NULL);

	// save as a regular file
	bSuccess = FreeImage_Save(FIF_PNG, check, "dump.png", PNG_DEFAULT);
	assert(bSuccess == TRUE);

	FreeImage_Unload(check);
	FreeImage_Unload(dib);

	// The memIO object will be destroyed automatically
}

/**
Test loading from a buffer attached to a memory stream
*/
void testLoadMemIO(const char *lpszPathName) {
	struct stat buf;
	int result;
	BOOL bSuccess = FALSE;

	// get data associated with lpszPathName
	result = stat(lpszPathName, &buf);
	if(result == 0) {
		// allocate a memory buffer and load temporary data
		BYTE *mem_buffer = (BYTE*)malloc(buf.st_size * sizeof(BYTE));
		if(mem_buffer) {
			FILE *stream = fopen(lpszPathName, "rb");
			if(stream) {
				fread(mem_buffer, sizeof(BYTE), buf.st_size, stream);
				fclose(stream);

				// attach the binary data to a memory stream
				fipMemoryIO memIO(mem_buffer, buf.st_size);

				// get the file type
				FREE_IMAGE_FORMAT fif = memIO.getFileType();

				// load an image from the memory stream
				FIBITMAP *check = memIO.load(fif, PNG_DEFAULT);
				assert(check != NULL);

				// save as a regular file
				bSuccess = FreeImage_Save(FIF_PNG, check, "blob.png", PNG_DEFAULT);
				assert(bSuccess == TRUE);
				
				// close the stream (memIO is destroyed)
			}

			// user is responsible for freeing the data
			free(mem_buffer);
		}
	}
}

/**
Test extracting a memory buffer from a memory stream
*/
void testAcquireMemIO(const char *lpszPathName) {
	BOOL bSuccess = FALSE;

	// load a regular file
	FREE_IMAGE_FORMAT fif = FreeImage_GetFileType(lpszPathName);
	FIBITMAP *dib = FreeImage_Load(fif, lpszPathName, 0);

	// open and allocate a memory stream
	fipMemoryIO memIO;

	// save the file to memory
	bSuccess = memIO.save(FIF_PNG, dib, PNG_DEFAULT);
	assert(bSuccess == TRUE);

	// get the buffer from the memory stream
	BYTE *mem_buffer = NULL;
	DWORD size_in_bytes = 0;

	bSuccess = memIO.acquire(&mem_buffer, &size_in_bytes);
	assert(bSuccess == TRUE);

	// save the buffer in a file stream
	FILE *stream = fopen("buffer.png", "wb");
	if(stream) {
		fwrite(mem_buffer, sizeof(BYTE), size_in_bytes, stream);
		fclose(stream);
	}

	// close and free the memory stream (memIO is destroyed)
}

/**
Test Loading / Saving from / to a memory stream using fipImage
*/
void testImageMemIO(const char *lpszPathName) {
	BOOL bSuccess = FALSE;

	fipMemoryIO memIO;
	fipImage image;

	// load a regular file
	bSuccess = image.load(lpszPathName);
	assert(bSuccess == TRUE);
	if(bSuccess) {
		// save the file to a memory stream
		bSuccess = image.saveToMemory(FIF_PNG, memIO, PNG_DEFAULT);
		assert(bSuccess);
		
		// load the file from the memory stream
		memIO.seek(0L, SEEK_SET);
		bSuccess = image.loadFromMemory(memIO, 0);
		assert(bSuccess);
	}
}

void testMemIO(const char *lpszPathName) {
	cout << "testMemIO ...\n";

	testSaveMemIO(lpszPathName);
	testLoadMemIO(lpszPathName);
	testAcquireMemIO(lpszPathName);
	testImageMemIO(lpszPathName);
}

