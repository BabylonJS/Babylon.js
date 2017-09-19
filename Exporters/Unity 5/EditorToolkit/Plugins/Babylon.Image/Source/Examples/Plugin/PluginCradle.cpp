// ==========================================================
// Loader/Saver Plugin Cradle
//
// Design and implementation by
// - Floris van den Berg (flvdberg@wxs.nl)
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

#include <windows.h>
#include <stdlib.h>

#include "FreeImage.h"
#include "Utilities.h"

// ==========================================================

BOOL APIENTRY
DllMain(HANDLE hModule, DWORD  ul_reason_for_call, LPVOID lpReserved) {
	switch (ul_reason_for_call) {
		case DLL_PROCESS_ATTACH :
		case DLL_PROCESS_DETACH :
		case DLL_THREAD_ATTACH  :
		case DLL_THREAD_DETACH  :
			break;
    }

    return TRUE;
}

// ==========================================================
// Plugin Interface
// ==========================================================

static int s_format_id;

// ==========================================================
// Plugin Implementation
// ==========================================================

/**
    Returns the format string for the plugin. Each plugin,
	both internal in the DLL and external in a .fip file, must have
	a unique format string to be addressable.
*/

static const char * DLL_CALLCONV
Format() {
	return "CRADLE";
}

/**
    Returns a description string for the plugin. Though a
	description is not necessary per-se,
	it is advised to return an unique string in order to tell the
	user what type of bitmaps this plugin will read and/or write.
*/

static const char * DLL_CALLCONV
Description() {
	return "Here comes the description for your image loader/saver";
}

/**
    Returns a comma separated list of file extensions indicating 
	what files this plugin can open. no spaces or whatsoever are allowed. 
	The list, being used by FreeImage_GetFIFFromFilename, is usually
	used as a last resort in finding the type of the bitmap we
	are dealing with. Best is to check the first few bytes on
	the low-level bits level first and compare them with a known
	signature . If this fails, FreeImage_GetFIFFromFilename can be
	used.
*/

static const char * DLL_CALLCONV
Extension() {
	return "ext1,ext2";
}

/**
	RegExpr is only needed for the Qt wrapper
	It allows the Qt mechanism for loading bitmaps to identify the bitmap
*/
static const char * DLL_CALLCONV
RegExpr() {
	return NULL;
}

/**
	Returns a MIME content type string for that format (MIME stands
	for Multipurpose Internet Mail Extension).
*/
static const char * DLL_CALLCONV
MimeType() {
	return "image/myformat";
}

/**
	FreeImage's internal way of seeing if a bitmap is of the desired type.
	When the type of a bitmap is to be retrieved, FreeImage runs Validate
	for each registered plugin until one returns true. If a plugin doesn't
	have a validate function, a return value of false is assumed.

	You can always force to use a particular plugin by directly specifying
	it on the command line, but this can result in a dead DLL if the plugin
	was not made for the bitmap.
*/
static BOOL DLL_CALLCONV
Validate(FreeImageIO &io, fi_handle handle) {
	return FALSE;
}

/**
	SupportsExportDepth is the first in a possible range of new plugin functions
	to ask specific information to that plugin. This function returns TRUE if it
	can save a bitmap in the required bitdepth. If it can't the bitmap has to be
	converted by the user or another plugin has to be chosen.
*/
static BOOL DLL_CALLCONV
SupportsExportDepth(int depth) {
	return FALSE;
}

/**
	Returns TRUE if the plugin belonging to the given FREE_IMAGE_FORMAT can save a
	bitmap in the desired data type, returns FALSE otherwise. Currently, TIFF is the only plugin
	able to save all non-standard images. The PNG plugin is able to save unsigned 16-bit
	images.
*/
static BOOL DLL_CALLCONV 
SupportsExportType(FREE_IMAGE_TYPE type) {
	return (type == FIT_BITMAP) ? TRUE : FALSE;
}

/**
	SupportsICCProfiles informs FreeImage that a plugin supports ICC profiles. 
	This function returns TRUE if the plugin can load and save a profile.
	ICC profile information is accessed via freeimage->get_icc_profile_proc(dib)
*/
static BOOL DLL_CALLCONV
SupportsICCProfiles() {
	return FALSE;
}


// ----------------------------------------------------------

/**
    Loads a bitmap into memory. On entry it is assumed that
	the bitmap to be loaded is of the correct type. If the bitmap
	is of an incorrect type, the plugin might not gracefully fail but
	crash or enter an endless loop. It is also assumed that all
	the bitmap data is available at one time. If the bitmap is not complete,
	for example because it is being downloaded while loaded, the plugin
	might also not gracefully fail.

	The Load function has the following parameters:

    The first parameter (FreeImageIO *io) is a structure providing
	function pointers in order to make use of FreeImage's IO redirection. Using
	FreeImage's file i/o functions instead of standard ones it is garantueed
	that all bitmap types, both current and future ones, can be loaded from
	memory, file cabinets, the internet and more. The second parameter (fi_handle handle)
	is a companion of FreeImageIO and can be best compared with the standard FILE* type,
	in a generalized form.

	The third parameter (int page) indicates wether we will be loading a certain page
	in the bitmap or if we will load the default one. This parameter is only used if
	the plugin supports multi-paged bitmaps, e.g. cabinet bitmaps that contain a series
	of images or pages. If the plugin does support multi-paging, the page parameter
	can contain either a number higher or equal to 0 to load a certain page, or -1 to 
	load the default page. If the plugin does not support multi-paging,
	the page parameter is always -1.
	
	The fourth parameter (int flags) manipulates the load function to load a bitmap
	in a certain way. Every plugin has a different flag parameter with different meanings.

	The last parameter (void *data) can contain a special data block used when
	the file is read multi-paged. Because not every plugin supports multi-paging
	not every plugin will use the data parameter and it will be set to NULL.However,
	when the plugin does support multi-paging the parameter contains a pointer to a
	block of data allocated by the Open function.
*/

static FIBITMAP * DLL_CALLCONV
Load(FreeImageIO *io, fi_handle handle, int page, int flags, void *data) {
	return NULL;
}

static BOOL DLL_CALLCONV
Save(FreeImageIO *io, FIBITMAP *dib, fi_handle handle, int page, int flags, void *data) {
	return FALSE;
}

// ==========================================================
//   Init
// ==========================================================

/**
    Initialises the plugin. The first parameter (Plugin *plugin)
	contains a pointer to a pre-allocated Plugin structure
	wherein pointers to the available plugin functions
	has to be stored. The second parameter (int format_id) is an identification
	number that the plugin may use to show plugin specific warning messages
	or other information to the user. The plugin number
	is generated by FreeImage and can differ everytime the plugin is
	initialised.

    If you want to create your own plugin you have to take some
	rules into account. Plugin functions have to be compiled
	__stdcall using the multithreaded c runtime libraries. Throwing
	exceptions in plugin functions is allowed, as long as those exceptions
	are being caught inside the same plugin. It is forbidden for a plugin
	function to directly call FreeImage functions or to allocate memory
	and pass it to the main DLL. Exception to this rule is the special file data
	block that may be allocated the Open function. Allocating a FIBITMAP inside a
	plugin can be using the function allocate_proc in the FreeImage structure,
	which will allocate the memory using the DLL's c runtime library.
*/

void DLL_CALLCONV
Init(Plugin *plugin, int format_id) {
	s_format_id = format_id;

	plugin->format_proc = Format;
	plugin->description_proc = Description;
	plugin->extension_proc = Extension;
	plugin->regexpr_proc = RegExpr;
	plugin->open_proc = NULL;
	plugin->close_proc = NULL;
	plugin->pagecount_proc = NULL;
	plugin->pagecapability_proc = NULL;
	plugin->load_proc = Load;
	plugin->save_proc = Save;
	plugin->validate_proc = Validate;
	plugin->mime_proc = MimeType;
	plugin->supports_export_bpp_proc = SupportsExportDepth;
	plugin->supports_export_type_proc = SupportsExportType;
	plugin->supports_icc_profiles_proc = SupportsICCProfiles;
}
