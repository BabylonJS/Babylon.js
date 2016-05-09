/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxquaternion.h
#ifndef _FBXSDK_CORE_MATH_QUATERNION_H_
#define _FBXSDK_CORE_MATH_QUATERNION_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxvector4.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FBX SDK quaternion class.
 * \nosubgrouping
 * Quaternions form a four-dimensional normed division algebra over the real numbers. 
 * It is for calculations involving three-dimensional rotations. 
 */
class FBXSDK_DLL FbxQuaternion : public FbxDouble4
{
public:
    /**
      * \name Constructors and Destructor
      */
    //@{
		/** Constructor.
		  * Initialize to the multiplicative identity.
		  */
		FbxQuaternion();

		/** Copy constructor.
		  * \param pV FbxQuaternion object copied to this one.
		  */
		FbxQuaternion(const FbxQuaternion& pV);

		/** Constructor.
			* \param pX     The X component.
			* \param pY     The Y component.
			* \param pZ     The Z component.
			* \param pW     The W component.
			*/
		FbxQuaternion(double pX, double pY, double pZ, double pW = 1.0);

		/** From axis degree constructor
		* \param pAxis The axis to rotate around.
		* \param pDegree The amount of degree to rotate around the axis. */
		FbxQuaternion(const FbxVector4& pAxis, double pDegree);
		    
		//! Destructor.
		~FbxQuaternion();
    //@}

    /**
      * \name Access
      */
    //@{
		/** Assignment operation.
		  * \param pQuaternion FbxQuaternion object assigned to this one.
		  */
		FbxQuaternion& operator=(const FbxQuaternion& pQuaternion);
		    
		/** Accessor.
		  * \param pIndex     The index of the component to access.
		  * \return           The reference to the indexed component.
		  * \remarks          The index parameter is not checked for values out of bounds. The valid range is [0,3].
		  */
		double& operator[](int pIndex);

		/** Accessor.
		  * \param pIndex     The index of the component to access.
		  * \return           The const reference to the indexed component.
		  * \remarks          The index parameter is not checked for values out of bounds. The valid range is [0,3].
		  */
		const double& operator[](int pIndex) const;

		/** Get a vector element.
		  * \param pIndex     The index of the component to access.
		  * \return           The value of the indexed component.
		  * \remarks          The index parameter is not checked for values out of bounds. The valid range is [0,3].
		  */
		double GetAt(int pIndex) const;

		/** Set a vector element.
		  * \param pIndex     The index of the component to set.
		  * \param pValue     The new value to set the component.
		  * \remarks          The index parameter is not checked for values out of bounds. The valid range is [0,3].
		  */
		void SetAt(int pIndex, double pValue);

		/** Set vector.
		  * \param pX     The X component value.
		  * \param pY     The Y component value.
		  * \param pZ     The Z component value.
		  * \param pW     The W component value.
		  */
		void Set(double pX, double pY, double pZ, double pW = 1.0);
    //@}

    /**
      * \name Scalar Operations
      */
    //@{
		/** The addition operator between the scalar part of this quaternion and a scalar value, no influence on the vector part of the quaternion.
		  * \param pValue     The scalar value to be added.
		  * \return           The sum of addition.
		  */
		FbxQuaternion operator+(double pValue) const;

		/** The subtraction operator between the scalar part of this quaternion and a scalar value, no influence on the vector part of the quaternion.
		  * \param pValue     The scalar subtrahend.
		  * \return           The difference of subtraction.
		  */
		FbxQuaternion operator-(double pValue) const;

		/** Multiply all vector components by a value.
		  * \param pValue     The value multiplying each component of the vector.
		  * \return           New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxQuaternion operator*(double pValue) const;

		/**    Divide all vector components by a value.
		  * \param pValue     The value dividing each component of the vector.
		  * \return           New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxQuaternion operator/(double pValue) const;

		/** The in place addition operator between the real part of this quaternion and a scalar value.
		  * \param pValue     The value to be added.
		  * \return           The sum of addition.
		  */
		FbxQuaternion& operator+=(double pValue);

		/** The subtraction operator between the real part of this quaternion and a scalar value.
		  * \param pValue     The scalar subtrahend.
		  * \return           The difference of subtraction.
		  */
		FbxQuaternion& operator-=(double pValue);

		/** Multiply a value to all vector elements.
		  * \param pValue     The value multiplying each component of the vector.
		  * \return           The result of multiplying each component of the vector by pValue, replacing this quaternion.
		  * \remarks          The passed value is not checked.
		  */
		FbxQuaternion& operator*=(double pValue);

		/**    Divide all vector elements by a value.
		  * \param pValue     The value dividing each component of the vector.
		  * \return           The result of dividing each component of the vector by pValue, replacing this quaternion.
		  * \remarks          The passed value is not checked.
		  */
		FbxQuaternion& operator/=(double pValue);
    //@}

    /**
      * \name Vector Operations
      */
    //@{
		/**    Unary minus operator.
		  * \return      A quaternion where each component is multiplied by -1.
		  */
		FbxQuaternion operator-() const;
		    
		/** Add two vectors together.
		  * \param pQuaternion     Quaternion to add.
		  * \return                The quaternion v' = this + pQuaternion.
		  * \remarks               The values in pQuaternion are not checked.
		  */
		FbxQuaternion operator+(const FbxQuaternion& pQuaternion) const;

		/** Subtract a quaternion from another quaternion.
		  * \param pQuaternion     Quaternion to subtract.
		  * \return                The quaternion v' = this - pQuaternion.
		  * \remarks               The values in pQuaternion are not checked.
		  */
		FbxQuaternion operator-(const FbxQuaternion& pQuaternion) const;

		/** The quaternion multiplication operator.
		  * \param pOther          The quaternion to be multiplied with this quaternion.
		  * \return                The product of two quaternions.
		  * \remarks               In general, quaternion multiplication does not commute.
		  */
		FbxQuaternion operator*(const FbxQuaternion& pOther) const;

		/** The quaternion division operator.
		  * \param pOther          The divisor quaternion.
		  * \return                The quotient quaternion.
		  * \remarks               If the divisor has a zero length, return zero quaternion.
			  */
		FbxQuaternion operator/(const FbxQuaternion& pOther) const;

		/** Add two quaternions together.
		  * \param pQuaternion     Quaternion to add.
		  * \return                The quaternion v' = this + pQuaternion, replacing this quaternion.
		  * \remarks               The values in pQuaternion are not checked.
		  */
		FbxQuaternion& operator+=(const FbxQuaternion& pQuaternion);

		/** Subtract a quaternion from another vector.
		  * \param pQuaternion     Quaternion to subtract.
		  * \return                The quaternion v' = this - pQuaternion, replacing this quaternion.
		  * \remarks               The values in pQuaternion are not checked.
		  */
		FbxQuaternion& operator-=(const FbxQuaternion& pQuaternion);

		/** The in place quaternion multiplication operator.
		  * \param pOther          The quaternion to be multiplied with this quaternion.
		  * \return                The product of two quaternions.
		  * \remarks               In general, quaternion multiplication does not commute.
		  */
		FbxQuaternion& operator*=(const FbxQuaternion& pOther);
			
		/** The in place quaternion division operator.
		  * \param pOther          The divisor quaternion.
		  * \return                The quotient quaternion.
		  * \remarks               If the divisor has a zero length, return zero quaternion.
		  */
		FbxQuaternion& operator/=(const FbxQuaternion& pOther);

		/** Return quaternion product.
		  * \param pOther          The quaternion to be multiplied with this quaternion.
		  * \return                The product of two quaternions.
		  */
		FbxQuaternion Product(const FbxQuaternion& pOther) const;

		/** Return quaternion dot product.
		  * \param pQuaternion     Dot product quaternion.
		  * \return                The dot product of this quaternion and pQuaternion.
		  */
		double DotProduct(const FbxQuaternion& pQuaternion) const;

		/** Normalize the quaternion, length set to 1.
		  */
		void Normalize();

		/** Calculate the quaternion conjugate.
		  * \return      The conjugate of this quaternion.
		  */
		void Conjugate();

		/** Calculate the length (norm) of the quaternion.
		  * \return The length of the quaternion.
		  */
		double Length();

		/** Calculate the inverse of the quaternion.
		  * \return      The inverse of this quaternion. 
		  * \remarks     If this quaternion has a zero length, retain the original value.
		  * \remarks     If the quaternion is normalized, then its inverse is equal to its conjugate.
		  */
		void Inverse();

		/** Set the quaternion rotation from an axis degree angle.
		* \param pAxis The axis to rotate around.
		* \param pDegree The amount of degree to rotate around the axis. */
		void SetAxisAngle(const FbxVector4& pAxis, double pDegree);

		/** Calculate a spherical linear interpolation quaternion.
		* \param pOther The other quaternion to interpolate with.
		* \param pWeight A value between 0.0 and 1.0 to specify the interpolation amount. */
		FbxQuaternion Slerp(const FbxQuaternion& pOther, double pWeight) const;

		/** Create a Quaternion equivalent to the supplied Euler XYZ in spherical coordinate.
		  * \param pEuler   The Euler XYZ angle (in degrees).
		  */
		void ComposeSphericalXYZ(const FbxVector4 pEuler);

		/** Create an Euler XYZ equivalent to the current quaternion.
		  * \return     The Euler XYZ angle (in degrees) equivalent to the current quaternion in spherical coordinate.
		  */
		FbxVector4 DecomposeSphericalXYZ() const;
    //@}

    /**
      * \name Boolean Operations
      */
    //@{
		/**    Equivalence operator.
		  * \param pV     The quaternion to be compared to this quaternion.
		  * \return       \c true  if the two quaternions are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c false  otherwise.
		  */
		bool operator==(const FbxQuaternion & pV) const;
		    
		/**    Non equivalence operator.
		  * \param pV     The quaternion to be compared to \e this.
		  * \return       \c  false if the two quaternions are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c true  otherwise.
		  */
		bool operator!=(const FbxQuaternion & pV) const;
    //@}

    /**
      * \name Casting
      */
    //@{
		//! Cast the vector in a double pointer.
		operator double* ();

		//! Cast the vector in a const double pointer.
		operator const double* () const;
    //@}

	/**
	  * \name Comparison methods
	  */
	//@{
		/** Comparison method.
		  * \param pQ2 Quaternion to compare with this
		  * \param pThreshold Epsilon for small number comparison
		  * \return 0 if quaternions are equal, non-zero value otherwise.
		  */
		int Compare(const FbxQuaternion &pQ2, const double pThreshold = FBXSDK_TOLERANCE) const;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    void GetQuaternionFromPositionToPosition(const FbxVector4 &pP0, const FbxVector4 &pP1);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_QUATERNION_H_ */
