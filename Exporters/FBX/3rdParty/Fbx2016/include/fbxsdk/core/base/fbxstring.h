/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxstring.h
#ifndef _FBXSDK_CORE_BASE_STRING_H_
#define _FBXSDK_CORE_BASE_STRING_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Convert string from UTF8 to wide-char
* \param pInUTF8 Input string
* \param pOutWideChar output string
* \param pOutWideCharSize size of the allocated output string buffer
* \remark Output buffer should be release by caller */
FBXSDK_DLL void FbxUTF8ToWC(const char* pInUTF8, wchar_t*& pOutWideChar, size_t* pOutWideCharSize=NULL);

/** Convert string from wide-char to UTF8
* \param pInWideChar input string
* \param pOutUTF8 output string
* \param pOutUTF8Size size of the allocated output string buffer
* \remark Output buffer should be release by caller */
FBXSDK_DLL void FbxWCToUTF8(const wchar_t* pInWideChar, char*& pOutUTF8, size_t* pOutUTF8Size=NULL);

#if defined(FBXSDK_ENV_WIN)
	/** Convert string from wide-char to ANSI
	* \param pInWideChar input string
	* \param pOutANSI output string
	* \param pOutANSISize size of the allocated output string buffer
	* \remark Output buffer should be release by caller */
	FBXSDK_DLL void FbxWCToAnsi(const wchar_t* pInWideChar, char*& pOutANSI, size_t* pOutANSISize=NULL);

	/** Convert string from ANSI to wide-char
	* \param pInANSI input string
	* \param pOutWideChar output string
	* \param pOutWideCharSize size of the allocated output string buffer
	* \remark Output buffer should be release by caller */
	FBXSDK_DLL void FbxAnsiToWC(const char* pInANSI, wchar_t*& pOutWideChar, size_t* pOutWideCharSize=NULL);

	/** Convert string from ANSI to UTF8
	* \param pInANSI input string
	* \param outUTF8 output string
	* \param pOutUTF8Size size of the allocated output string buffer
	* \remark Output buffer should be release by caller */
	FBXSDK_DLL void FbxAnsiToUTF8(const char* pInANSI, char*& pOutUTF8, size_t* pOutUTF8Size=NULL);

	/** Convert string from UTF8 to ANSI
	* \param pInUTF8 input string
	* \param pOutANSI output string
	* \param pOutANSISize size of the allocated output string buffer
	* \remark Output buffer should be release by caller */
	FBXSDK_DLL void FbxUTF8ToAnsi(const char* pInUTF8, char*& pOutANSI, size_t* pOutANSISize=NULL);
#endif

/** Utility class to manipulate strings.
* \nosubgrouping */
class FBXSDK_DLL FbxString
{
public:
	/**
	* \name Constructors and Destructor
	*/
	//@{
		//! Default constructor.
		FbxString();

		/** Copy constructor.
		* \param pString The FbxString to be copied. */
		FbxString(const FbxString& pString);

		/** String constructor.
		* \param pString The string used to construct FbxString. */
		FbxString(const char* pString);

		/** Character constructor.
		* \param pChar The character used to construct FbxString.
		* \param pNbRepeat The number of times to repeat the character. Default value is 1 */
		FbxString(char pChar, size_t pNbRepeat=1);

		/** String constructor with maximum length.
		* \param pCharPtr The string used to construct FbxString. 
		* \param pLength  Maximum length. */
		FbxString(const char* pCharPtr, size_t pLength);

		/** Integer constructor.
		* \param pValue The int value used to construct FbxString. */
		FbxString(const int pValue);

		/** Float constructor.
		* \param pValue The float value used to construct FbxString. */
		FbxString(const float pValue);

		/** Double constructor.
		* \param pValue The double value used to construct FbxString. */
		FbxString(const double pValue);

		//! Destructor.
		~FbxString();
	//@}

	/**
	* \name Buffer Access and Validation
	*/
	//@{
		//! Get string length like "C" strlen().
		size_t GetLen() const;

		//! Get string length like "C" strlen().
		size_t Size() const;

		//! Return \c true if string length equal zero.
		bool IsEmpty() const;

		//! Discard the content of the string.
		FbxString& Clear();

		/** Access by reference.
		* \param pIndex   The index.
		* \return The reference of the char at pIndex. */
		char& operator[](int pIndex);

		/** Access by copy.
		* \param pIndex   The index.
		* \return The char at pIndex. */
		char operator[](int pIndex) const;

		//! Non-const buffer access.
		char* Buffer();

		//! Const buffer access.
		const char* Buffer()const;
	//@}

	/**
	* \name String Operations
	*/
	//@{
		/** FbxString assignment operator.
		* \param pString The FbxString to be assigned. */
		const FbxString& operator=(const FbxString& pString);

		/** Character assignment operator.
		* \param pChar The character to be assigned. */
		const FbxString& operator=(char pChar);

		/** String assignment operator.
		* \param pString The string to be assigned. */
		const FbxString& operator=(const char* pString);

		/** Int assignment operator.
		* \param pValue The int value to be assigned. */
		const FbxString& operator=(int pValue);

		/** Float assignment operator.
		* \param pValue The float value to be assigned. */
		const FbxString& operator=(float pValue);

		/** Double assignment operator.
		* \param pValue The double value to be assigned. */
		const FbxString& operator=(double pValue);

		/** FbxString append.
		* \param pString The FbxString to be appended. */
		const FbxString& operator+=(const FbxString& pString);

		/** Character append.
		* \param pChar  The character to be appended. */
		const FbxString& operator+=(char pChar);

		/** String append.
		* \param pString The string to be appended. */
		const FbxString& operator+=(const char* pString);

		/** Integer append.
		* \param pValue The int value to be appended. */
		const FbxString& operator+=(int pValue);

		/** Float append.
		* \param pValue The float value to be appended. */
		const FbxString& operator+=(float pValue);

		/** Double append.
		* \param pValue The double value to be appended. */
		const FbxString& operator+=(double pValue);

		/** Equality operator.
		* \param pString The FbxString to be compared. */
		bool operator== (const FbxString& pString) const;

		/** Inequality operator.
		* \param pString The FbxString to be compared. */
		bool operator!= (const FbxString& pString) const;

		/** Inferior to operator.
		* \param pString The FbxString to be compared. */
		bool operator< (const FbxString& pString) const;

		/** Inferior or equal to operator.
		* \param pString The FbxString to be compared. */
		bool operator<= (const FbxString& pString) const;

		/** Superior or equal to operator.
		* \param pString The FbxString to be compared. */
		bool operator>= (const FbxString& pString) const;

		/** Superior to operator.
		* \param pString The FbxString to be compared. */
		bool operator> (const FbxString& pString) const;

		/** Equality operator.
		* \param pString The string to be compared. */
		bool operator== (const char* pString) const;

		/** Inequality operator.
		* \param pString The string to be compared. */
		bool operator!= (const char* pString) const;

		/** Inferior to operator.
		* \param pString The string to be compared. */
		bool operator< (const char* pString) const;

		/** Inferior or equal to operator.
		* \param pString The string to be compared. */
		bool operator<= (const char* pString) const;

		/** Superior or equal to operator.
		* \param pString The string to be compared. */
		bool operator>= (const char* pString) const;

		/** Superior to operator.
		* \param pString The string to be compared. */
		bool operator> (const char* pString) const;

		/** FbxString concatenation.
		* \param pString1 FbxString 1 to be concatenated to FbxString 2.
		* \param pString2 FbxString 2 to be concatenated to FbxString 1 */
		friend FBXSDK_DLL FbxString operator+(const FbxString& pString1, const FbxString& pString2);

		/** Character concatenation.
		* \param pString  FbxString to be concatenated to Character.
		* \param pChar  Character to be concatenated to FbxString */
		friend FBXSDK_DLL FbxString operator+(const FbxString& pString, char pChar);

		/** Character concatenation.
		* \param pChar  Character to be concatenated to FbxString
		* \param pString  FbxString to be concatenated to Character. */
		friend FBXSDK_DLL FbxString operator+(char pChar, const FbxString& pString);

		/** String concatenation.
		* \param pString1  FbxString to be concatenated to String.
		* \param pString2  String to be concatenated to FbxString */
		friend FBXSDK_DLL FbxString operator+(const FbxString& pString1, const char* pString2);

		/** String concatenation.
		* \param pString1  String to be concatenated to FbxString
		* \param pString2  FbxString to be concatenated to String. */
		friend FBXSDK_DLL FbxString operator+(const char* pString1, const FbxString& pString2);

		/** Integer concatenation.
		* \param pString  FbxString to be concatenated to Integer.
		* \param pValue  Integer to be concatenated to FbxString */
		friend FBXSDK_DLL FbxString operator+(const FbxString& pString, int pValue);

		/** Integer concatenation.
		* \param pValue  Integer to be concatenated to FbxString 
		* \param pString  FbxString to be concatenated to Integer. */
		friend FBXSDK_DLL FbxString operator+(int pValue, const FbxString& pString);

		/** Float concatenation.
		* \param pString  FbxString to be concatenated to Float.
		* \param pValue  Float to be concatenated to FbxString */
		friend FBXSDK_DLL FbxString operator+(const FbxString& pString, float pValue);

		/** Float concatenation.
		* \param pValue  Float to be concatenated to FbxString
		* \param pString  FbxString to be concatenated to Float. */
		friend FBXSDK_DLL FbxString operator+( float pValue, const FbxString& pString);

		/** Double concatenation.
		* \param pString  FbxString to be concatenated to Double.
		* \param pValue  Double to be concatenated to FbxString */
		friend FBXSDK_DLL FbxString operator+(const FbxString& pString, double pValue);

		//! Cast operator.
		operator const char*() const;

		/** String assignment function with maximum length.
		  * \param pString The string to be assigned.
		  * \param pLength The maximum length of string to be assigned. */
		const FbxString& Copy(const char* pString, size_t pLength);

		/** Append as "C" strncat().
		* \param pString The string to be appended.
		* \param pLength The length of chars to be appended. */
		const FbxString& Append(const char* pString, size_t pLength);

		/** Compare as "C" strcmp().
		* \param pString    The string to be compared. */
		int Compare(const char* pString) const;

		/** Compare as "C" stricmp().
		* \param pString    The string to be compared. */
		int CompareNoCase(const char* pString) const;

		/** Swap the contents of two strings.
		* \param pString The FbxString to be swapped. */
		void Swap(FbxString& pString);

		//! Uppercase conversion.
		FbxString Upper() const;

		//! Lowercase conversion.
		FbxString Lower() const;
	//@}

    /**
    * \name Substring Extraction
    */
    //@{
		/** Extract middle string for a given length.
		* \param pFirst The start index of FbxString to be extracted.
		* \param pCount The length of sub-string to be extracted. */
		FbxString Mid(size_t pFirst, size_t pCount) const;

		/** Extract middle string up to the end.
		* \param pFirst The start index of FbxString to be extracted. */
		FbxString Mid(size_t pFirst) const;

		/** Extract left string.
		* \param pCount The length of sub-string to be extracted. */
		FbxString Left(size_t pCount) const;

		/** Extract right string.
		* \param pCount The length of sub-string to be extracted. */
		FbxString Right(size_t pCount) const;
	//@}

	/**
	* \name Padding
	*/
	//@{
		/** \enum EPaddingType      Padding types.
		* - \e eRight
		* - \e eLeft
		* - \e eBoth */
		enum EPaddingType {eRight, eLeft, eBoth};

		/** Add padding characters.
		* \param pPadding The padding type.
		* \param pLen The length limit of FbxString after padding. 
		* \param pCar The character to be padded. */
		FbxString Pad(EPaddingType pPadding, size_t pLen, char pCar=' ') const;

		/** Remove padding characters.
		* \param pPadding The padding type.
		* \param pCar The character to be padded. 
		* \remark If pCar == '\0' the function will remove all the characters that are tested by isspace(). */
		FbxString UnPad(EPaddingType pPadding, char pCar='\0') const;
	//@}

	/**
	* \name Search
	*/
	//@{
		/** Look for a single character match, like "C" strchr().
		* \param pChar The character to look for.
		* \param pStartPosition  Start position to look for.
		* \return Index or -1 if not found. */
		int Find(char pChar, size_t pStartPosition=0) const;

		/** Look for a substring match, like "C" strstr().
		* \param pStrSub The substring to look for.
		* \param pStartPosition  Start position to look for.
		* \return Starting index or -1 if not found. */
		int Find(const char* pStrSub, size_t pStartPosition=0) const;

		/** Look for the last occurrence of character in string, like "C" strrchr().
		* \param pChar The character to look for.
		* \return Index or -1 if not found. */
		int ReverseFind(char pChar) const;

		/** Look for a single character match, like "C" strpbrk().
		* \param pStrCharSet The character set.
		* \param pStartPosition The start position.
		* \return Index or -1 if not found. */
		int FindOneOf(const char* pStrCharSet, size_t pStartPosition=0) const;

		/** Replace a substring.
		* \param pFind The substring to look for.
		* \param pReplaceBy The string to replace by.
		* \param pStartPosition The start position. 
		* \return \c true if substring found and replaced. */
		bool FindAndReplace(const char* pFind, const char* pReplaceBy, size_t pStartPosition=0);

		/** Replace all occurrence of a substring.
		* \param pFind The substring to look for.
		* \param pReplaceBy The string to replace by.
		* \return \c true if something got replaced. */
		bool ReplaceAll(const char* pFind, const char* pReplaceBy);

        /** Replace all occurrence of character to find by replacement character.
		* \param pFind The character to look for.
		* \param pReplaceBy The character to replace by.
		* \return \c true if character found and replaced. */
		bool ReplaceAll(char pFind, char pReplaceBy);
	//@}

	/**
	* \name Token Extraction
	*/
	//@{
		/** Get number of tokens.
		* \param pSpans The span
		* \return The number of tokens. */
		int GetTokenCount(const char* pSpans) const;

		/** Get token at given index.
		* \param pTokenIndex The token index.
		* \param pSpans The span */
		FbxString GetToken(int pTokenIndex, const char* pSpans) const;
	//@}

private:
	// Lengths/sizes in characters. 
	// Note: an extra character is always allocated.
	char* mData; // Actual string (zero terminated).

	FbxString(size_t pSrc1Len, const char* pSrc1Data, size_t pSrc2Len, const char* pSrc2Data); // Previously ConcatCopy
	void Init();

	//! Invalidate string.
	void Invalidate();

	void FreeBuffer();
	void FreeBuffer(char *&pOldData);

	bool AllocCopy(FbxString& pDest, size_t pCopyLen, size_t pCopyIndex) const;
	bool AllocBuffer(size_t pLen);
	bool AllocBuffer(size_t pLen, char*& pOldData);

	bool AssignCopy(size_t pSrcLen, const char* pSrcData);
	bool ConcatInPlace(size_t pSrcLen, const char* pSrcData);

	bool IsIn(char pChar, const char* pString) const;
	bool InternalFindAndReplace(const char* pFind, const char* pReplaceBy, size_t& pStartPosition); 
};

FBXSDK_INCOMPATIBLE_WITH_ARRAY(FbxString);

//! FbxString concatenation.
FBXSDK_DLL FbxString operator+(const FbxString& pString1, const FbxString& pString2);

//! Character concatenation.
FBXSDK_DLL FbxString operator+(const FbxString& pString, char pChar);

//! String concatenation.
FBXSDK_DLL FbxString operator+(const FbxString& pString1, const char* pString2);

//! Integer concatenation.
FBXSDK_DLL FbxString operator+(const FbxString& pString, int pValue);

//! Float concatenation.
FBXSDK_DLL FbxString operator+(const FbxString& pString, float pValue);

//! Double concatenation.
FBXSDK_DLL FbxString operator+(const FbxString& pString, double pValue);

//! Functor to compare FbxString
struct FbxStringCompare { inline int operator()(const FbxString& pKeyA, const FbxString& pKeyB) const { return pKeyA.Compare(pKeyB); } };

//! Functor to compare FbxString without case sensitivity
struct FbxStringCompareNoCase { inline int operator()(const FbxString& pKeyA, const FbxString& pKeyB) const { return pKeyA.CompareNoCase(pKeyB); } };

//! Functor to compare "C" strings
struct FbxCharPtrCompare { inline int operator()(const char* pKeyA, const char* pKeyB) const { return strcmp(pKeyA, pKeyB); } };

//! Functor to compare "C" strings without case sensitivity
struct FbxCharPtrCompareNoCase { inline int operator()(const char* pKeyA, const char* pKeyB) const { return FBXSDK_stricmp(pKeyA, pKeyB); } };

/** Remove the given char in the given string.
* \param pString The given string.
* \param pToRemove The given char that ought to be removed.
* \remarks Strings used in this function are case-sensitive. */
inline void FbxRemoveChar(FbxString& pString, char pToRemove)
{
    int lPos = pString.ReverseFind(pToRemove);
    while( lPos >= 0 )
    {
        pString = pString.Left(lPos) + pString.Mid(lPos + 1);
        lPos = pString.ReverseFind(pToRemove);
    }
}

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_STRING_H_ */
