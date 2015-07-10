/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxbase64coder.h
#ifndef _FBXSDK_FILEIO_BASE64CODER_H_
#define _FBXSDK_FILEIO_BASE64CODER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class decodes Base64 encoded data. */
class FBXSDK_DLL FbxBase64Decoder
{
public:
	/** Decodes the input buffer.
	* \param pInBuffer the input buffer containing Base64 data.
	* \param pInSize the size of the input data in bytes (must be a multiple of 4)
	* \param pOutBuffer the destination buffer.
	* \param pOutSize the capacity of the output buffer in bytes.
	* \return the number of bytes put in the output buffer, or -1 if the output buffer is too small, or contains invalid characters */
    int Decode(const void* pInBuffer, int pInSize, void* pOutBuffer, int pOutSize);

	/** Decodes the input buffer.
	* \param pInBuffer the input buffer containing Base64 data; its length is computed using strlen().
	* \param pOutBuffer the destination buffer.
	* \param pOutSize the capacity of the output buffer in bytes.
	* \return the number of bytes put in the output buffer. */
    int Decode(const char* pInBuffer, void* pOutBuffer, int pOutSize);
};

/** This class encodes data in the Base64 format. */
class FBXSDK_DLL FbxBase64Encoder
{
public:
	/** Encodes the input buffer.
	* \param pInBuffer the input buffer containing data.
	* \param pInSize the size of the input data in bytes.
	* \param pOutBuffer the destination buffer, receives data encoded in Base64.
	* \param pOutSize the capacity of the output buffer in bytes, which should be at least 33% larger than the input buffer size, or 4 bytes whichever is more.
	* \return the number of bytes put in the output buffer, or -1 if we ran out of room. */
    int Encode(const void* pInBuffer, int pInSize, void* pOutBuffer, int pOutSize);

	/** Encodes the input buffer.
	* \param pInBuffer the input buffer containing data.
	* \param pInSize the size of the input data in bytes.
	* \param pOutBuffer the destination buffer; data is set, not appended.
	* \return the number of bytes put in the output buffer. */
    int Encode(const void* pInBuffer, int pInSize, FbxString& pOutBuffer);
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_BASE64CODER_H_ */
