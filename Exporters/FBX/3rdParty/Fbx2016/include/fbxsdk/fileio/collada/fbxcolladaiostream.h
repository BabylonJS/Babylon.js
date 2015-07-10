/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcolladaiostream.h
#ifndef _FBXSDK_FILEIO_COLLADA_IO_STREAM_H_
#define _FBXSDK_FILEIO_COLLADA_IO_STREAM_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//----------------------------------------------------------------------------//

/** Convert part of the source string into destination type.
  * \param pDest The destination with a specific type.
  * \param pSourceBegin The begin of the source string.
  * \param pSourceEnd Return the end of the part of the source string.
  * \return Return \c true on success and \c false if else.
  */
template <typename T> bool FromString(T * pDest, const char * pSourceBegin, const char ** pSourceEnd = NULL);
template <> bool FromString(int * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(double * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxString * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxDouble2 * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxDouble3 * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxDouble4 * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxVector4 * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxAMatrix * pDest, const char * pSourceBegin, const char ** pSourceEnd);
template <> bool FromString(FbxAMatrix * pDest, const char * pSourceBegin, const char ** pSourceEnd);



/** Parse the string into an array.
  * The source string is made up with many groups and each group contains pSourceGroupSize units separated by spaces;
  * The destination array is also made up with many groups and each unit contains pDestGroupSize units.
  * The valid unit range in each source group is [pSourceUnitOffset, pSourceUnitOffset + pSourceValidUnitCount).
  * The valid unit range in each destination unit is [pDestUnitOffset, pDestUnitOffset + pDestValidUnitCount).
  * The units in invalid range of destination is set to a default value.
  */
template <typename TYPE> int FromStringToArray(const char * pString, TYPE * pArray, int pSourceUnitOffset, int pSourceValidUnitCount, int pSourceGroupSize, int pDestUnitOffset, int pDestValidUnitCount, int pDestGroupSize, TYPE pDefaultValue = TYPE())
{
    if (pString == 0 || pArray == 0)
        return 0;

    FBX_ASSERT(pSourceUnitOffset >= 0 && pSourceUnitOffset < pSourceGroupSize);
    FBX_ASSERT(pSourceValidUnitCount >= 0 && pSourceUnitOffset + pSourceValidUnitCount <= pSourceGroupSize);
    FBX_ASSERT(pDestUnitOffset >= 0 && pDestUnitOffset < pDestGroupSize);
    FBX_ASSERT(pDestValidUnitCount >= 0 && pDestUnitOffset + pDestValidUnitCount <= pDestGroupSize);
    const char * lSource = pString;
    TYPE * lDest = pArray;

    int lReadCount = 0;
    int lSourceCounter = 0;
    int lDestCounter = 0;
    const int lSourceUnitValidEnd = pSourceUnitOffset + pSourceValidUnitCount;
    const int lDestUnitGap = pDestGroupSize - pDestValidUnitCount - pDestUnitOffset;
    while (lSource && *lSource)
    {
        TYPE lData;
        const char * lSourceStart = lSource;
        if (FromString(&lData, lSource, &lSource) && lSourceCounter >= pSourceUnitOffset && lSourceCounter < lSourceUnitValidEnd)
        {
            if (lDestCounter == 0)
            {
                for (int lIndex = 0; lIndex < pDestUnitOffset; ++lIndex)
                    *(lDest++) = pDefaultValue;
            }

            *lDest++ = lData;
            ++lReadCount;
            ++lDestCounter;
            if (lDestCounter == pDestValidUnitCount)
            {
                lDestCounter = 0;
                for (int lIndex = 0; lIndex < lDestUnitGap; ++lIndex)
                    *lDest++ = pDefaultValue;
            }
        }
        else
        {
            // we met a stop condition of FromString. In the normal case, lSource should now be "" or ' '. If not,
            // the converted string is corrupted and we have to break the loop. We can detect this by checking
            // if lSource pointer has moved.
            if (lSource == lSourceStart)
            {
                break;
            }
        }
        ++lSourceCounter;
        if (lSourceCounter == pSourceGroupSize)
            lSourceCounter = 0;
    }
    return lReadCount;
}

//----------------------------------------------------------------------------//

template <typename T>
const FbxString ToString(const T & pValue)
{
    return FbxString(pValue);
}
template <>
const FbxString ToString(const FbxVector4 & pValue);
template <>
const FbxString ToString(const FbxAMatrix & pValue);

//----------------------------------------------------------------------------//

/** Decode percent encoded characters, returns an empty string if there's an error.
  * For example, a string like "abc%20abc" is converted into "abc abc".
  * \param pEncodedString The percent encoded string.
  * \return The decoded string.
  */
const FbxString DecodePercentEncoding(const FbxString & pEncodedString);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_IO_STREAM_H_ */
