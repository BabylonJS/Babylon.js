/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxrenamingstrategyutilities.h
#ifndef _FBXSDK_UTILS_RENAMINGSTRATEGY_UTILITIES_H_
#define _FBXSDK_UTILS_RENAMINGSTRATEGY_UTILITIES_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#define NAMECLASH1_KEY      "_ncl1_" // name (x)
#define NAMECLASH2_KEY		"_ncl2_" // Upper/lower cases clash

#define UPPERTOLOWER_KEY	"ul"
#define LOWERTOUPPER_KEY	"lu"

/** \brief This class contains a set of utilities, which are used by the FBX renaming strategy.
* \nosubgrouping
*/
class FBXSDK_DLL FbxRenamingStrategyUtils
{
public:

    /** Check if the string has non alphanumeric characters and replace them with a special string containing a prefix and 
    * the character code. 
    * \param pString  String to be processed. The result of the conversion is also returned in this string.
    * \param pFirstCharMustBeAlphaOnly  This flag tells whether the first char of the string must be alpha only. Its default
    *                                   value is \c false.
    * \param pPermittedChars   List of non alphanumeric characters that do not require to be converted because already 
    *                          supported by the destination application. When encountered, these characters are simply 
    *                          skipped and left as is.
    * \param p8bitCharsOnly When \c true, this flag tells the routine that only 8 bit coded characters can be 
    *                       represented by the encoding format (see note below). If set to \c false, the range of supported
    *                       character is increased and the memory usage may be less. But the routine will perform slower 
    *                       because of the internal conversions required.
    * \return Returns \c true if at least one character in \c pString has been encoded.
    * \note   The encoding string depends on the value of \c p8bitCharsOnly argument. When this parameter value is \c true, 
    *         each non-alphanumeric character is replaced with FBXASC### (where ### is the decimal code of the character). 
    *         Inversely, when the value is \c false, each non-alphanumeric characters is replaced with FBXCHR##### (where 
    *         ##### is the hexadecimal representation of the character code).
    */
    static bool EncodeNonAlpha(FbxString &pString, bool pFirstCharMustBeAlphaOnly=false, FbxString pPermittedChars="", bool p8bitCharsOnly = true);

    /** Take a string that has been encoded by EncodeNonAlpha and re-extract the non-alphanumeric values.
    * \param pString String to be processed. The result of the conversion is also returned in this string.
    * \return Returns \c true if the \c pString argument has been decoded.
    */
    static bool DecodeNonAlpha(FbxString &pString);

    /** This method will add the _ncl1_ with the provided pInstanceNumber to the string
    * \param pString
    * \param pInstanceNumber  Its default value is 0.
    * \return Always returns true.
    * \remarks please ALWAYS call Encode Duplicate BEFORE Encode Case Insensitive.
    */
    static bool EncodeDuplicate(FbxString &pString, int pInstanceNumber=0);

    /** This method will remove the _ncl1_xxx from the given string
    * \param pString
    * \return Returns true if the pString has been modified
    */
    static bool DecodeDuplicate(FbxString &pString);

    /** This method will compare pString and pString2, set pString to pString2 and append the ncl2 suffix to it
    * \param pString
    * \param pString2
    * \return Returns true if the pString has been modified
    * \remarks pString and pString2 must be identical except for casing.
    */
    static bool EncodeCaseInsensitive(FbxString &pString, const FbxString pString2);

    /** This method will decode a string that has a ncl2 to it
    * \param pString
    * \return Returns true if the pString has been modified
    */
    static bool DecodeCaseInsensitive(FbxString &pString);

};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_RENAMINGSTRATEGY_UTILITIES_H_ */
