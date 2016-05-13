/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpropertytypes.h
#ifndef _FBXSDK_CORE_PROPERTY_TYPES_H_
#define _FBXSDK_CORE_PROPERTY_TYPES_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/core/math/fbxvector2.h>
#include <fbxsdk/core/math/fbxvector4.h>
#include <fbxsdk/core/math/fbxmatrix.h>
#include <fbxsdk/core/fbxsystemunit.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//! Type identifier constants
enum EFbxType
{
	eFbxUndefined,			//!< Unidentified.
	eFbxChar,				//!< 8 bit signed integer.
	eFbxUChar,				//!< 8 bit unsigned integer.
	eFbxShort,				//!< 16 bit signed integer.
	eFbxUShort,				//!< 16 bit unsigned integer.
	eFbxUInt,				//!< 32 bit unsigned integer.
	eFbxLongLong,			//!< 64 bit signed integer.
	eFbxULongLong,			//!< 64 bit unsigned integer.
	eFbxHalfFloat,			//!< 16 bit floating point.
	eFbxBool,				//!< Boolean.
	eFbxInt,				//!< 32 bit signed integer.
	eFbxFloat,				//!< Floating point value.
	eFbxDouble,				//!< Double width floating point value.
	eFbxDouble2,			//!< Vector of two double values.
	eFbxDouble3,			//!< Vector of three double values.
	eFbxDouble4,			//!< Vector of four double values.
	eFbxDouble4x4,			//!< Four vectors of four double values.
	eFbxEnum		= 17,	//!< Enumeration.
	eFbxEnumM		=-17,	//!< Enumeration allowing duplicated items.
	eFbxString		= 18,	//!< String.
	eFbxTime,				//!< Time value.
	eFbxReference,			//!< Reference to object or property.
	eFbxBlob,				//!< Binary data block type.
	eFbxDistance,			//!< Distance.
	eFbxDateTime,			//!< Date and time.
	eFbxTypeCount	= 24	//!< Indicates the number of type identifiers constants.
};

/** Class to represent colors in RGBA format using doubles.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxColor
{
public:
    //! Constructor.
    FbxColor();

	/** Constructor.
	  * \param pRed       The Red component value.
	  * \param pGreen     The Green component value.
	  * \param pBlue      The Blue component value.
	  * \param pAlpha     The alpha value of the color.
	  */
	FbxColor(const double pRed, const double pGreen, const double pBlue, const double pAlpha=1.0);
	FbxColor(const FbxDouble3& pRGB, const double pAlpha=1.0);
	FbxColor(const FbxDouble4& pRGBA);

    //! Destructor.
    ~FbxColor();

	/** Re-initialize the color object with their new values.
	  * \param pRed       The Red component value.
	  * \param pGreen     The Green component value.
	  * \param pBlue      The Blue component value.
	  * \param pAlpha     The alpha value of the color.
	  */
	void Set(const double pRed, const double pGreen, const double pBlue, const double pAlpha=1.0);

	/** Indicate if all the members in the color objects are within their valid range.
	  * \return     \c true if all the members are within their valid range.
	  */
	bool IsValid() const;

    /** Accessors.
      * \param pIndex The index of the component to access.
      * \return The reference to the indexed component.
      * \remarks The pIndex parameter is not checked for values out of bounds.
      */
    double& operator[](int pIndex);

    /** Accessors.
      * \param pIndex The index of the component to access.
      * \return The reference to the indexed component.
      * \remarks The pIndex parameter is not checked for values out of bounds.
      */
    const double& operator[](int pIndex) const;

	/**
	  * \name Operators
	  */
	//@{
		/** Assignment operator.
		  * \param pColor FbxColor to be copied.
		  */
		FbxColor& operator=(const FbxColor& pColor);
		FbxColor& operator=(const FbxDouble3& pColor);
		FbxColor& operator=(const FbxDouble4& pColor);

		/** Equality operator.
		  * \param pColor FbxColor compared with this one.
		  * \return \c true if equal, \c false if unequal.
		  */
		bool operator==(const FbxColor& pColor) const;

		/** Inequality operator.
		  * \param pColor FbxColor compared with this one.
		  * \return \c true if unequal, \c false if equal.
		  */
		bool operator!=(const FbxColor& pColor) const;
	//@}

	/**
	  * name Public Members
	  */
	//@{
		//! Valid range is from 0.0 to 1.0.
		double mRed;

		//! Valid range is from 0.0 to 1.0.
		double mGreen;

		//! Valid range is from 0.0 to 1.0.
		double mBlue;

		//! Valid range is from 0.0 to 1.0.
		double mAlpha;
	//@}
};

/**	FBX SDK half-float class.
  * Property used to store half-float (16 bit float) number.
  * This class only holds the value in 2 byte buffer (unsigned short). There is
  * no direct math manipulation of this type except for the conversion to/from
  * float. On disk, this type is also saved as an unsigned short.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxHalfFloat
{
public:
	/**
	  *\name Constructors
	  */
	//@{
		FbxHalfFloat();
		FbxHalfFloat(float pVal);
		FbxHalfFloat(const FbxHalfFloat& pVal);
	//@}

	/** Assign operator
	  * \param pValue       The half-float to be assigned to this instance.
	  * \return             This half-float.
	  */
    FbxHalfFloat& operator=(const FbxHalfFloat& pValue);
    
	/**
	  * \name boolean operation
	  */
	//@{
		/** Equivalence operator.
		  * \param pRHS          The half-float to be compared with this one.
		  * \return              \c True, if the two values are equal, \c false otherwise.
		  */
		bool operator==(const FbxHalfFloat& pRHS) const;

		/** Non-equivalence operator.
		  * \param pRHS          The half-float to be compared with this one
		  * \return              \c True, if the two values are unequal, \c false otherwise.
		  */
		bool operator!=(const FbxHalfFloat& pRHS) const;
	//@}

	/**
	  * \name Access
	  */
	//@{
		/** Retrieve the value as a float.
		  */
		const float value() const;

		/** Retrieve the value as it is stored.
		  */
		unsigned const short internal_value() const;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	typedef unsigned short half;
	half mValue;

	// we want to extract the mantissa, exponent and sign from the float number.
	// by the IEEE 754 binary standard, the float number is divided as: 
	//        sign          : 1 bit
	//        mantissa      : 23 bits
	//        exponent      : 8 bits
	//        exponent bias : 127
	// and the half-float is:
	//        sing          : 1 bit
	//        mantissa      : 10 bits
	//        exponent      : 5 bits
	//        exponent bias :

	half FtoHF(float *f);
	float HFtoF(half h) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** FBX SDK blob class. 
  * Uninitialized data of a specified size, to be filled by the user.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxBlob
{
public:
	/**
	  * \name Constructors and Destructor
	  */
	//@{
		//! Constructor.  Set attributes to 0.
		FbxBlob();

		/** Constructor.  Construct a buffer with uninitialized data of a specified size, to be filled by the user.
		  * \param pSize                Buffer size.
		  */
		FbxBlob(int pSize);

		/** Copy constructor.
		  * \param pRHS                 The blob to be copied to this blob.
		  */
		FbxBlob(const FbxBlob& pRHS);

		/** Constructor.
		  * \param pData                The data to be filled in the buffer.
		  * \param pSize                Buffer size.
		  */
		FbxBlob(const void* pData, int pSize);

		//! Destructor
		~FbxBlob();
	//@}

	/**
	  * \name Assignment.
	  */
	//@{
		/** Share the buffer of the specified blob with this blob. 
		  * \param pValue               The blob whose buffer is shared with this blob.
		  * \return                     This blob.
		  */
		FbxBlob& operator=(const FbxBlob& pValue);

		/** Copy the data in the buffer.
		 * \param pData                 The buffer to be copied data from.
		 * \param pSize                 Buffer size.
		 */
		void Assign(const void* pData, int pSize);  // Always makes a copy.
	//@}

    /**
	  * \name Boolean operation
	  */
    //@{
		/** Equality operator.
		 * \param pRHS                  The blob to be compared with this blob.
		 * \return                      \c True, if the two blobs are equal, \c false otherwise.
		 */
		 bool operator==(const FbxBlob& pRHS) const; // Compare the contents.

		/** Inequality operator.
		  * \param pRHS                  The blob to be compared with this blob.
		  * \return                      \c True, if the two blobs are unequal, otherwise false.
		  */
		bool operator!=(const FbxBlob& pRHS) const;
	//@}

	//!Make a copy if the reference count > 1 (i.e. if the buffer is shared).
	void* Modify(); 

	/**
	  * \name Access
	  */
	//@{
    
		/** Retrieve the buffer pointer.
		  * \return                      The buffer pointer.
		  */
		const void * Access() const;

		/** Retrieve the buffer size
		  * \return                       The buffer size.
		  */
		int Size() const;
	//@}

    //! Free the memory if this blob is the last one to hold it.
	void Clear(); 

protected:
    int*	mRefCount;
    void*	mData;
    int     mSize;
};

/**	FBX SDK date&time class.
  * Property used to store date and time information; not related to a FbxTime, which is
  * used for film-related operations.
  * The date and time property does not make any provisions for UTC, GMT or local
  * zones; this is entirely up to client code to know what they are dealing with.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxDateTime
{
public:
	/**
	  *\name Constructors
	  */
	//@{
		//! Default constructor. Set attributes to 0.   
		FbxDateTime();

		/** Constructor.
		  * \param pDay           Day
		  * \param pMonth         Month
		  * \param pYear          Year
		  * \param pHour          Hour
		  * \param pMin           Minute
		  * \param pSec           Second
		  * \param pMillisecond   Millisecond
		  * \remark If one or more argument is invalid, the object is reset to 0.
		  */
		FbxDateTime(int pDay, int pMonth, int pYear, int pHour, int pMin, int pSec, int pMillisecond=0);
	//@}

	/**
	  * \name Boolean operation
	  */
	//@{
		/** Equivalence operator.
		  *\param pRHS              The date&time to be compared with this date&time.
		  *\return              \c True, if the two date&time are equal, \c false otherwise.
		  */
		bool operator==(const FbxDateTime& pRHS) const;

		/** Non-equivalence operator
		  *\param pRHS         The date&time to be compared with this date&time.
		  *\return             \c True, if the two date&time are not equal, \c false otherwise.
		  */
		bool operator!=(const FbxDateTime& pRHS) const;
	//@}

	//! Set the attributes to 0.
	void Clear();
	
	/** Validates each field is within a normal range (month is 1-12, etc).
	  * \return               \c True, if each field is within a normal range, \c false otherwise.
	  */
	bool isValid() const;
   
	/**
	  * \name Access
	  */
    //@{
		/** Set the date.
		  * \param pDay          Day to be set.
		  * \param pMonth        Month to be set.
		  * \param pYear         Year to be set.
		  * \remark If one or more argument is invalid, the object is reset to 0.
		  */
		void setDate(int pDay, int pMonth, int pYear);

		/** Set the time. 
		  * \param pHour         Hour to be set.
		  * \param pMin          Minute to be set.
		  * \param pSec          Second to be set.
		  * \param pMillisecond  Millisecond to be set.
		  * \remark If one or more argument is invalid, the object is reset to 0.
		  */
		void setTime(int pHour, int pMin, int pSec, int pMillisecond = 0);
	//@}

	/**
	  * \name  Operation with string
	  */
	//@{
		/** Get the string format from this date&time.
		  * \return              The string format got from this date&time.
		  */
		FbxString toString() const;

		/** Get date&time from the string format.
		  * \return             \c True, if get date&time from the string format successfully, \c false otherwise.
		  * \remarks            ! This will only work with the format returned by toString(); if the format
		  *                     is not the same will return 'false' and the content of this object will
		  *                     remain unchanged.
		  */
		bool fromString(const char*);
	//@}
   
	/** Get date&time from current date&time of GMT.
	  * \return             The date&time equal to current date&time of GMT.         
	  */
    static FbxDateTime currentDateTimeGMT();

private:
	FbxShort mMillisecond;            // 0-999
    FbxShort mYear;                   // No check

    FbxChar  mMonth;                  // 1-12
    FbxChar  mDay;                    // 1-31; no check with regards to the month
    FbxChar  mHour;                   // 0-23
    FbxChar  mMinute;                 // 0-59
    FbxChar  mSecond;                 // 0-59
};

/** FBX SDK distance class.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxDistance
{
public:
	/**
	  * \name Constructors and Destructor
	  */
	//@{
		//! Default constructor.
		FbxDistance();

		/** Constructor with default values.
		  * \param pValue      Value of distance using the measurement unit.
		  * \param pUnit       Unit of measurement.
		  */
		FbxDistance(float pValue, FbxSystemUnit pUnit);

		/** Constructor.    
		  * \param pValue      Value of distance using the measurement unit.
		  * \param pUnit       Unit of measurement.
		  * \remarks           This constructor will convert string to FbxSystemUnit.
		  */
		FbxDistance(float pValue, const char* pUnit);

		//! Destructor.
		~FbxDistance();
	//@}

	/** Assign operator
	  * \param pValue       The distance to be assigned to this distance.
	  * \return             This distance.
	  */
    FbxDistance& operator=(const FbxDistance& pValue);
    
	/**
	  * \name boolean operation
	  */
	//@{
		/** Equivalence operator.
		  * \param pRHS          The distance to be compared with this distance.
		  * \return              \c True, if the two distances are equal, \c false otherwise.
		  */
		bool operator==(const FbxDistance& pRHS) const;

		/** Non-equivalence operator.
		  * \param pRHS          The distance to be compared with this distance.
		  * \return              \c True, if the two distances are unequal, \c false otherwise.
		  */
		bool operator!=(const FbxDistance& pRHS) const;
	//@}
	
    const FbxString unitName() const;

	/**
	  * \name Access
	  */
	//@{
		/** Retrieve the measurement unit
		  * \return             The measure unit of the distance.
		  */
		const FbxSystemUnit unit() const;

		/** Retrieve the distance value 
		  * \return             The value of the distance in the defined measurement unit.   
		  */
		const float value() const;
	//@}

    /** Get the value of distance when converting this measurement unit to inch.
	  * \return             The value of distance when converting this measurement unit to inch.
	  */
    const float internalValue() const;

	/** Get the value of distance when converting this measurement unit to the specified measurement unit.
	  * \param pUnit       The measurement unit to be converted to.
	  * \return            The value of distance when using the specified measurement unit.
	  */
    const float valueAs(const FbxSystemUnit& pUnit) const;

private:
    float               mValue;
    FbxSystemUnit      mUnit;
};

/** Retrieve a type enumeration memory footprint size
* \param pType The type enumeration
* \return The size of this type in memory */
FBXSDK_DLL const size_t FbxTypeSizeOf(const EFbxType pType);

/** Retrieve a type enumeration component count
* \param pType The type enumeration
* \return The number of component used by this type */
FBXSDK_DLL const size_t FbxTypeComponentCount(const EFbxType pType);

// Type management for properties
inline EFbxType FbxTypeOf(const FbxChar&){ return eFbxChar; }
inline EFbxType FbxTypeOf(const FbxUChar&){ return eFbxUChar; }
inline EFbxType FbxTypeOf(const FbxShort&){ return eFbxShort; }
inline EFbxType FbxTypeOf(const FbxUShort&){ return eFbxUShort; }
inline EFbxType FbxTypeOf(const FbxUInt&){ return eFbxUInt; }
inline EFbxType FbxTypeOf(const FbxLongLong&){ return eFbxLongLong; }
inline EFbxType FbxTypeOf(const FbxULongLong&){ return eFbxULongLong; }
inline EFbxType FbxTypeOf(const FbxHalfFloat&){ return eFbxHalfFloat; }
inline EFbxType FbxTypeOf(const FbxBool&){ return eFbxBool; }
inline EFbxType FbxTypeOf(const FbxInt&){ return eFbxInt; }
inline EFbxType FbxTypeOf(const FbxFloat&){ return eFbxFloat; }
inline EFbxType FbxTypeOf(const FbxDouble&){ return eFbxDouble; }
inline EFbxType FbxTypeOf(const FbxDouble2&){ return eFbxDouble2; }
inline EFbxType FbxTypeOf(const FbxDouble3&){ return eFbxDouble3; }
inline EFbxType FbxTypeOf(const FbxDouble4&){ return eFbxDouble4; }
inline EFbxType FbxTypeOf(const FbxDouble4x4&){ return eFbxDouble4x4; }
inline EFbxType FbxTypeOf(const FbxVector2&){ return eFbxDouble2; }
inline EFbxType FbxTypeOf(const FbxVector4&){ return eFbxDouble4; }
inline EFbxType FbxTypeOf(const FbxQuaternion&){ return eFbxDouble4; }
inline EFbxType FbxTypeOf(const FbxMatrix&){ return eFbxDouble4x4; }
inline EFbxType FbxTypeOf(const FbxAMatrix&){ return eFbxDouble4x4; }
inline EFbxType FbxTypeOf(const FbxString&){ return eFbxString; }
inline EFbxType FbxTypeOf(const FbxTime&){ return eFbxTime; }
inline EFbxType FbxTypeOf(const FbxReference&){ return eFbxReference; }
inline EFbxType FbxTypeOf(const FbxBlob&){ return eFbxBlob; }
inline EFbxType FbxTypeOf(const FbxColor&){ return eFbxDouble4; }
inline EFbxType FbxTypeOf(const FbxDistance&){ return eFbxDistance; }
inline EFbxType FbxTypeOf(const FbxDateTime&){ return eFbxDateTime; }

template <class T> inline EFbxType FbxTypeOf(const T&){ FBX_ASSERT_NOW("Unknown type!"); return eFbxUndefined; }

bool FBXSDK_DLL FbxTypeCopyStr(FbxDouble& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxBool& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxInt& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxChar& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxUChar& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxShort& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxUShort& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxUInt& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxLongLong& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxULongLong& pDst, const FbxString& pSrc);
bool FBXSDK_DLL FbxTypeCopyStr(FbxHalfFloat& pDst, const FbxString& pSrc);

// Copy types and conversions
template<class T1, class T2> inline bool FbxTypeCopy(T1&, const T2&){ FBX_ASSERT_NOW("Incompatible type assignment!" ); return false; }

//! Same type conversion
inline bool FbxTypeCopy(FbxChar& pDst, const FbxChar& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxUChar& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxShort& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxUShort& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxUInt& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxLongLong& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxULongLong& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxHalfFloat& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxBool& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxInt& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxFloat& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxDouble& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxDouble2& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxDouble3& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble4& pDst, const FbxDouble4& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble4x4& pDst, const FbxDouble4x4& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxString& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxTime& pDst, const FbxTime& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxReference& pDst, const FbxReference& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxBlob& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDistance& pDst, const FbxDistance& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDateTime& pDst, const FbxDateTime& pSrc){ pDst = pSrc; return true; }

//To FbxBool
inline bool FbxTypeCopy(FbxBool& pDst, const FbxChar& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxUChar& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxShort& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxUShort& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxUInt& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxLongLong& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxULongLong& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxHalfFloat& /*pSrc */){ return false; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxInt& pSrc){ pDst = pSrc == 0 ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxFloat& pSrc){ pDst = pSrc == 0.f ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxDouble& pSrc){ pDst = pSrc == 0. ? false : true; return true; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBool& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxChar
inline bool FbxTypeCopy(FbxChar& pDst, const FbxUChar& pSrc){ pDst = (FbxChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxUShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& pDst, const FbxBool& pSrc){ pDst = (FbxChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxChar& pDst, const FbxInt& pSrc){ pDst = (FbxChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxChar& pDst, const FbxFloat& pSrc){ pDst = (FbxChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxChar& pDst, const FbxDouble& pSrc){ pDst = (FbxChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxChar& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxUChar
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxChar& pSrc){ pDst = (FbxUChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxUShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxBool& pSrc){ pDst = (FbxUChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxInt& pSrc){ pDst = (FbxUChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxFloat& pSrc){ pDst = (FbxUChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxDouble& pSrc){ pDst = (FbxUChar)pSrc; return true; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUChar& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxShort
inline bool FbxTypeCopy(FbxShort& pDst, const FbxChar& pSrc){ pDst = (FbxShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxUChar& pSrc){ pDst = (FbxShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxUShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxBool& pSrc){ pDst = (FbxShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxInt& pSrc){ pDst = (FbxShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxFloat& pSrc){ pDst = (FbxShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxDouble& pSrc){ pDst = (FbxShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxShort& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxUShort
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxChar& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxUChar& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxShort& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxBool& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxInt& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxFloat& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxDouble& pSrc){ pDst = (FbxUShort)pSrc; return true; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUShort& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxInt
inline bool FbxTypeCopy(FbxInt& pDst, const FbxChar& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxUChar& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxShort& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxUShort& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxUInt& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxLongLong& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxULongLong& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxBool& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxFloat& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxDouble& pSrc){ pDst = (FbxInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxInt& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxUInt
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxChar& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxUChar& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxShort& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxUShort& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxLongLong& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxULongLong& pSrc)  { pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxBool& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxInt& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxFloat& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxDouble& pSrc){ pDst = (FbxUInt)pSrc; return true; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxUInt& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxLongLong
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxChar& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxUChar& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxShort& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxUShort& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxUInt& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxULongLong& pSrc)  { pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxBool& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxInt& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxFloat& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxDouble& pSrc){ pDst = (FbxLongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxLongLong& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxULongLong
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxChar& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxUChar& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxShort& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxUShort& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxUInt& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxLongLong& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxBool& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxInt& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxFloat& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxDouble& pSrc){ pDst = (FbxULongLong)pSrc; return true; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxULongLong& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxHalfFloat
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxChar& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxUChar& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxShort& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxUShort& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxUInt& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxLongLong& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxULongLong& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxBool& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxInt& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxFloat& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxDouble& pSrc){ FbxHalfFloat hf((float)pSrc); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxString& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxHalfFloat& pDst, const FbxDistance& pSrc){ FbxHalfFloat hf(pSrc.internalValue()); pDst = hf; return true; }
inline bool FbxTypeCopy(FbxHalfFloat& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxFloat
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxChar& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxUChar& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxShort& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxUShort& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxUInt& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxHalfFloat& pSrc){ pDst = pSrc.value()   ; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxBool& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxInt& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxDouble& pSrc){ pDst = (FbxFloat)pSrc; return true; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxString& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxFloat& pDst, const FbxDistance& pSrc){ pDst = pSrc.internalValue(); return true; }
inline bool FbxTypeCopy(FbxFloat& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxDouble
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxChar& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxUChar& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxShort& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxUShort& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxUInt& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxLongLong& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxULongLong& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxHalfFloat& pSrc){ pDst = (FbxDouble)pSrc.value(); return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxBool& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxInt& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxFloat& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxDouble2& pSrc){ pDst = (FbxDouble)pSrc[0];     return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxDouble3& pSrc){ pDst = (FbxDouble)pSrc[0];     return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxDouble4& pSrc){ pDst = (FbxDouble)pSrc[0];     return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxDouble4x4& pSrc){ pDst = (FbxDouble)pSrc[0][0];  return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxString& pSrc){ return FbxTypeCopyStr(pDst, pSrc); }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxTime& pSrc){ pDst = (FbxDouble)pSrc.GetSecondDouble();  return true; }
inline bool FbxTypeCopy(FbxDouble& pDst, const FbxDistance& pSrc){ pDst = pSrc.internalValue(); return true; }

//To FbxDouble2
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxChar& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxUChar& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxShort& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxUShort& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxUInt& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxLongLong& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxULongLong& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxHalfFloat& pSrc){ pDst = (FbxDouble)pSrc.value(); return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxBool& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxInt& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxFloat& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble2& pDst, const FbxDouble& pSrc){ pDst = (FbxDouble)pSrc; return true; }

//To FbxDouble3
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxChar& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxUChar& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxShort& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxUShort& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxUInt& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxLongLong& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxULongLong& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxHalfFloat& pSrc){ pDst = (FbxDouble)pSrc.value(); return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxBool& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxInt& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxFloat& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxDouble& pSrc){ pDst = (FbxDouble)pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false;  }
inline bool FbxTypeCopy(FbxDouble3& pDst, const FbxDouble4& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxString& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble3& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxDouble4
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxChar& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxUChar& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxUShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxBool& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxDouble& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& pDst, const FbxDouble3& pSrc){ pDst = pSrc; return true; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxString& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDouble4& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxString
inline bool FbxTypeCopy(FbxString& pDst, const FbxChar& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxUChar& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxShort& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxUShort& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxUInt& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxLongLong& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxULongLong& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxHalfFloat& pSrc){ pDst=FbxString((float)pSrc.value()); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxBool& pSrc){ pDst=pSrc ? "true" : "false"; return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxInt& pSrc){ pDst=FbxString((int)pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxFloat& pSrc){ pDst=FbxString(pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxDouble& pSrc){ pDst=FbxString(pSrc); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxDouble2& pSrc){ pDst=FbxString(pSrc[0])+","+FbxString(pSrc[1]); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxDouble3& pSrc){ pDst=FbxString(pSrc[0])+","+FbxString(pSrc[1])+","+FbxString(pSrc[2]); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxDouble4& pSrc){ pDst=FbxString(pSrc[0])+","+FbxString(pSrc[1])+","+FbxString(pSrc[2])+","+FbxString(pSrc[3]); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxDouble4x4& pSrc){ pDst=FbxString(pSrc[0][0])+","+FbxString(pSrc[0][1])+","+FbxString(pSrc[0][2])+","+FbxString(pSrc[0][3]); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxTime& pSrc){ char lTimeStr[128]; pSrc.GetTimeString(lTimeStr, FbxUShort(128)); pDst=lTimeStr; return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxReference& /*pSrc*/){ pDst="<reference>"; return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxBlob& /*pSrc*/){ pDst="<blob>"; return true; } // Or convert to ASCII-85?
inline bool FbxTypeCopy(FbxString& pDst, const FbxDistance& pSrc){ pDst= FbxString(pSrc.value()) + " " +pSrc.unitName(); return true; }
inline bool FbxTypeCopy(FbxString& pDst, const FbxDateTime& pSrc){ pDst= pSrc.toString(); return true; }

//To FbxBlob
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxChar& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxUChar& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxShort& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxUShort& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxUInt& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxLongLong& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxULongLong& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxHalfFloat& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxBool& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxInt& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxFloat& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxDouble& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxDouble2& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxDouble3& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxDouble4& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxDouble4x4& pSrc){ pDst.Assign(&pSrc, sizeof(pSrc)); return true; }
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxString& pSrc)
{
    bool lCastable = pSrc.GetLen() == pSrc.GetLen();
    FBX_ASSERT( lCastable );
    if( lCastable )
        pDst.Assign(pSrc.Buffer(), (int)pSrc.GetLen());
    return lCastable;
}
inline bool FbxTypeCopy(FbxBlob& pDst, const FbxTime& pSrc){ FbxLongLong t = pSrc.Get(); pDst.Assign( &t, sizeof(t)); return true; }
inline bool FbxTypeCopy(FbxBlob& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBlob& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxBlob& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxDistance
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxChar& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxUChar& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxUShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxBool& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxDouble& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const  FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxString& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDistance& /*pDst*/, const FbxDateTime& /*pSrc*/){ return false; }

//To FbxDateTime
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxChar& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxUChar& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxShort& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxUShort& /*pSrc*/){ return false; } 
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxUInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxLongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxULongLong& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxHalfFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxBool& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxInt& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxFloat& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxDouble& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxDouble2& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxDouble3& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxDouble4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxDouble4x4& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& pDst, const FbxString& pSrc){ return pDst.fromString(pSrc); }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxTime& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxReference& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxBlob& /*pSrc*/){ return false; }
inline bool FbxTypeCopy(FbxDateTime& /*pDst*/, const FbxDistance& /*pSrc*/){ return false; }

template<class T> inline bool FbxTypeCopy(T& pDst, const void* pSrc, EFbxType pSrcType)
{	
	switch( pSrcType )
	{
		case eFbxChar:		return FbxTypeCopy(pDst, *(FbxChar*)pSrc);
		case eFbxUChar:		return FbxTypeCopy(pDst, *(FbxUChar*)pSrc);
		case eFbxShort:		return FbxTypeCopy(pDst, *(FbxShort*)pSrc);
		case eFbxUShort:	return FbxTypeCopy(pDst, *(FbxUShort*)pSrc);
		case eFbxUInt:		return FbxTypeCopy(pDst, *(FbxUInt*)pSrc);
		case eFbxLongLong:	return FbxTypeCopy(pDst, *(FbxLongLong*)pSrc);
		case eFbxULongLong:	return FbxTypeCopy(pDst, *(FbxULongLong*)pSrc);
		case eFbxHalfFloat:	return FbxTypeCopy(pDst, *(FbxHalfFloat*)pSrc);
		case eFbxBool:		return FbxTypeCopy(pDst, *(FbxBool*)pSrc);
		case eFbxInt:		return FbxTypeCopy(pDst, *(FbxInt*)pSrc);
		case eFbxFloat:		return FbxTypeCopy(pDst, *(FbxFloat*)pSrc);
		case eFbxDouble:	return FbxTypeCopy(pDst, *(FbxDouble*)pSrc);
		case eFbxDouble2:	return FbxTypeCopy(pDst, *(FbxDouble2*)pSrc);
		case eFbxDouble3:	return FbxTypeCopy(pDst, *(FbxDouble3*)pSrc);
		case eFbxDouble4:	return FbxTypeCopy(pDst, *(FbxDouble4*)pSrc);
		case eFbxDouble4x4:	return FbxTypeCopy(pDst, *(FbxDouble4x4*)pSrc);
		case eFbxEnumM:
		case eFbxEnum:		return FbxTypeCopy(pDst, *(FbxEnum*)pSrc);
		case eFbxString:	return FbxTypeCopy(pDst, *(FbxString*)pSrc);
		case eFbxTime:		return FbxTypeCopy(pDst, *(FbxTime*)pSrc);
		case eFbxBlob:		return FbxTypeCopy(pDst, *(FbxBlob*)pSrc);
		case eFbxDistance:	return FbxTypeCopy(pDst, *(FbxDistance*)pSrc);
		case eFbxDateTime:	return FbxTypeCopy(pDst, *(FbxDateTime*)pSrc);

		case eFbxReference:
			FBX_ASSERT_NOW("Trying to set value on a void Reference type" );
			break;

		default:
			FBX_ASSERT_NOW("Trying to assign an unknown type" );
			break;
	}
	return false;
}

template<class T> inline bool FbxTypeCopy(void* pDst, EFbxType pDstType, const T& pSrc)
{
	switch( pDstType )
	{
		case eFbxChar:		return FbxTypeCopy(*(FbxChar*)pDst, pSrc);
		case eFbxUChar:		return FbxTypeCopy(*(FbxUChar*)pDst, pSrc);
		case eFbxShort:		return FbxTypeCopy(*(FbxShort*)pDst, pSrc);
		case eFbxUShort:	return FbxTypeCopy(*(FbxUShort*)pDst, pSrc);
		case eFbxUInt:		return FbxTypeCopy(*(FbxUInt*)pDst, pSrc);
		case eFbxLongLong:	return FbxTypeCopy(*(FbxLongLong*)pDst, pSrc);
		case eFbxULongLong:	return FbxTypeCopy(*(FbxULongLong*)pDst, pSrc);
		case eFbxHalfFloat:	return FbxTypeCopy(*(FbxHalfFloat*)pDst, pSrc);
		case eFbxBool:		return FbxTypeCopy(*(FbxBool*)pDst, pSrc);
		case eFbxInt:		return FbxTypeCopy(*(FbxInt*)pDst, pSrc);
		case eFbxFloat:		return FbxTypeCopy(*(FbxFloat*)pDst, pSrc);
		case eFbxDouble:	return FbxTypeCopy(*(FbxDouble*)pDst, pSrc);
		case eFbxDouble2:	return FbxTypeCopy(*(FbxDouble2*)pDst, pSrc);
		case eFbxDouble3:	return FbxTypeCopy(*(FbxDouble3*)pDst, pSrc);
		case eFbxDouble4:	return FbxTypeCopy(*(FbxDouble4*)pDst, pSrc);
		case eFbxDouble4x4:	return FbxTypeCopy(*(FbxDouble4x4*)pDst, pSrc);
		case eFbxEnumM:
		case eFbxEnum:		return FbxTypeCopy(*(FbxEnum*)pDst, pSrc);
		case eFbxString:	return FbxTypeCopy(*(FbxString*)pDst, pSrc);
		case eFbxTime:		return FbxTypeCopy(*(FbxTime*)pDst, pSrc);
		case eFbxBlob:		return FbxTypeCopy(*(FbxBlob*)pDst, pSrc);
		case eFbxDistance:	return FbxTypeCopy(*(FbxDistance*)pDst, pSrc);
		case eFbxDateTime:	return FbxTypeCopy(*(FbxDateTime*)pDst, pSrc);

		case eFbxReference:
			FBX_ASSERT_NOW("Trying to set value on a void Reference type" );
			break;

		default:
			FBX_ASSERT_NOW("Trying to assign an unknown type" );
			break;
	}
	return false;
}

inline bool FbxTypeCopy(void* pDst, EFbxType pDstType, const void* pSrc, EFbxType pSrcType)
{
	switch( pSrcType )
	{
		case eFbxChar:		return FbxTypeCopy(pDst, pDstType, *(FbxChar*)pSrc);
		case eFbxUChar:		return FbxTypeCopy(pDst, pDstType, *(FbxUChar*)pSrc);
		case eFbxShort:		return FbxTypeCopy(pDst, pDstType, *(FbxShort*)pSrc);
		case eFbxUShort:	return FbxTypeCopy(pDst, pDstType, *(FbxUShort*)pSrc);
		case eFbxUInt:		return FbxTypeCopy(pDst, pDstType, *(FbxUInt*)pSrc);
		case eFbxLongLong:	return FbxTypeCopy(pDst, pDstType, *(FbxLongLong*)pSrc);
		case eFbxULongLong:	return FbxTypeCopy(pDst, pDstType, *(FbxULongLong*)pSrc);
		case eFbxHalfFloat:	return FbxTypeCopy(pDst, pDstType, *(FbxHalfFloat*)pSrc);
		case eFbxBool:		return FbxTypeCopy(pDst, pDstType, *(FbxBool*)pSrc);
		case eFbxInt:		return FbxTypeCopy(pDst, pDstType, *(FbxInt*)pSrc);
		case eFbxFloat:		return FbxTypeCopy(pDst, pDstType, *(FbxFloat*)pSrc);
		case eFbxDouble:	return FbxTypeCopy(pDst, pDstType, *(FbxDouble*)pSrc);
		case eFbxDouble2:	return FbxTypeCopy(pDst, pDstType, *(FbxDouble2*)pSrc);
		case eFbxDouble3:	return FbxTypeCopy(pDst, pDstType, *(FbxDouble3*)pSrc);
		case eFbxDouble4:	return FbxTypeCopy(pDst, pDstType, *(FbxDouble4*)pSrc);
		case eFbxDouble4x4:	return FbxTypeCopy(pDst, pDstType, *(FbxDouble4x4*)pSrc);
		case eFbxEnumM:
		case eFbxEnum:		return FbxTypeCopy(pDst, pDstType, *(FbxEnum*)pSrc);
		case eFbxString:	return FbxTypeCopy(pDst, pDstType, *(FbxString*)pSrc);
		case eFbxTime:		return FbxTypeCopy(pDst, pDstType, *(FbxTime*)pSrc);
		case eFbxBlob:		return FbxTypeCopy(pDst, pDstType, *(FbxBlob*)pSrc);
		case eFbxDistance:	return FbxTypeCopy(pDst, pDstType, *(FbxDistance*)pSrc);
		case eFbxDateTime:	return FbxTypeCopy(pDst, pDstType, *(FbxDateTime*)pSrc);

		case eFbxReference:
			FBX_ASSERT_NOW("Trying to set value on a void Reference type" );
			break;

		default:
			FBX_ASSERT_NOW("Trying to assign an unknown type" );
			break;
	}
	return false;
}

/** Creates a fbx primitive type and initializes its memory.
  * \param pType The type of object to create.
  * \return A pointer to the new primitive object. Note that the caller owns the returned object.
  *         The pointer returned is NULL if pType is eFbxUndefined or an unknown type.
  */
FBXSDK_DLL void* FbxTypeAllocate(const EFbxType pType);

/** Destroys an fbx primitive type. If the return value is true
  * the memory pointed to by pData has been deleted and should
  * no longer be accessed.
  * \param pType The type of object being deleted
  * \param pData Pointer to the object being deleted.
  * \return true if the object was destroyed, false otherwise.
  */
FBXSDK_DLL bool FbxTypeDeallocate(const EFbxType pType, void* pData);

/** Compare two values of the same type
  * \param pA first value
  * \param pB second value
  * \param pType The data type of both values
  * \return \c true if equal, \c false otherwise
  */
FBXSDK_DLL bool FbxTypeCompare(const void* pA, const void* pB, const EFbxType pType);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_PROPERTY_TYPES_H_ */
