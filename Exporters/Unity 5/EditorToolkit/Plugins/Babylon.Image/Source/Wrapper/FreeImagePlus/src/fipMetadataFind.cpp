// ==========================================================
// fipMetadataFind class implementation
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

#include "FreeImagePlus.h"

BOOL fipMetadataFind::isValid() const {
	return (_mdhandle != NULL) ? TRUE : FALSE;
}

fipMetadataFind::fipMetadataFind() : _mdhandle(NULL) {
}

fipMetadataFind::~fipMetadataFind() {
	FreeImage_FindCloseMetadata(_mdhandle);
}

BOOL fipMetadataFind::findFirstMetadata(FREE_IMAGE_MDMODEL model, fipImage& image, fipTag& tag) {
	FITAG *firstTag = NULL;
	if(_mdhandle) FreeImage_FindCloseMetadata(_mdhandle);
	_mdhandle = FreeImage_FindFirstMetadata(model, image, &firstTag);
	if(_mdhandle) {
		tag = FreeImage_CloneTag(firstTag);
		return TRUE;
	}
	return FALSE;
} 

BOOL fipMetadataFind::findNextMetadata(fipTag& tag) {
	FITAG *nextTag = NULL;
	if( FreeImage_FindNextMetadata(_mdhandle, &nextTag) ) {
		tag = FreeImage_CloneTag(nextTag);
		return TRUE;
	}
	return FALSE;
}

