/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdualquaternion.h
#ifndef _FBXSDK_CORE_MATH_DUAL_QUATERNION_H_
#define _FBXSDK_CORE_MATH_DUAL_QUATERNION_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxquaternion.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	FBX SDK dual quaternion class to represent rigid transformation, which is combined by two quaternions.
  * A transformation is said to be rigid if it preserves relative distances and angles.
  * That means rotation and translation.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxDualQuaternion
{
public:
	/**
	  * \name Constructors and Destructor
	  */
	//@{
		//! Constructor.
		FbxDualQuaternion();

		/** Constructor.
		* \param pV1 FbxQuaternion object.
		* \param pV2 FbxQuaternion object.
		*/
		FbxDualQuaternion(const FbxQuaternion& pV1, const FbxQuaternion& pV2);

		/** Copy constructor.
		  * \param pV FbxQuaternion object copied to this one.
		  */
		FbxDualQuaternion(const FbxDualQuaternion& pV);

		/** Constructor.
		* \param pRotation     The rotation the dual quaternion is going to represent.
		* \param pTranslation  The translation the dual quaternion is going to represent.
		*/
		FbxDualQuaternion(const FbxQuaternion& pRotation, const FbxVector4& pTranslation);

		/** Constructor.
		  * \param pX1     The X component of the first quaternion.
		  * \param pY1     The Y component of the first quaternion.
		  * \param pZ1     The Z component of the first quaternion.
		  * \param pW1     The W component of the first quaternion.
		  * \param pX2     The X component of the second quaternion.
		  * \param pY2     The Y component of the second quaternion.
		  * \param pZ2     The Z component of the second quaternion.
		  * \param pW2     The W component of the second quaternion.
		  */
		FbxDualQuaternion(double pX1, double pY1, double pZ1, double pW1, double pX2, double pY2, double pZ2, double pW2);

		//! Destructor.
		~FbxDualQuaternion();
	//@}

	/**
	* \name Access
	*/
	//@{
		/** Assignment operation.
		* \param pDualQuaternion FbxDualQuaternion object assigned to this one.
		*/
		FbxDualQuaternion& operator=(const FbxDualQuaternion& pDualQuaternion);

		/** Set vector.
		* \param pX1     The X component of the first quaternion.
		* \param pY1     The Y component of the first quaternion.
		* \param pZ1     The Z component of the first quaternion.
		* \param pW1     The W component of the first quaternion.
		* \param pX2     The X component of the second quaternion.
		* \param pY2     The Y component of the second quaternion.
		* \param pZ2     The Z component of the second quaternion.
		* \param pW2     The W component of the second quaternion.
		*/
		void Set(double pX1, double pY1, double pZ1, double pW1, double pX2, double pY2, double pZ2, double pW2);

		/** Get the first quaternion of the dual quaternion.
		* \return The first quaternion of the dual quaternion.
		*/
		FbxQuaternion& GetFirstQuaternion();

		/** Get the second quaternion of the dual quaternion.
		* \return The second quaternion of the dual quaternion.
		*/
		FbxQuaternion& GetSecondQuaternion();

		/** Get the first quaternion of the dual quaternion.
		* \return The first quaternion of the dual quaternion.
		*/
		const FbxQuaternion& GetFirstQuaternion() const;

		/** Get the second quaternion of the dual quaternion.
		* \return The second quaternion of the dual quaternion.
		*/
		const FbxQuaternion& GetSecondQuaternion() const;

		/** Get the rotation part from the dual quaternion.
		* \return FbxQuaternion object to represent rotation.
		*/
		FbxQuaternion GetRotation() const;

		/** Get the translation part from the dual quaternion.
		* \return FbxVector4 object to represent translation.
		* \remarks A dual quaternion can represent rotation followed by translation, or translation followed by rotation.
		* This method assumes that the rotation is expressed first, followed by translation, as is done by most DCC tools.
		*/
		FbxVector4 GetTranslation() const;
	//@}

	/**
	  * \name Scalar Operations
	  */
	//@{
		/** Add a value to all vector components.
		  * \param pValue     The value to add to each component of the vector.
		  * \return           New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion operator+(double pValue) const;

		/** Subtract a value from all vector components.
		  * \param pValue     The value to subtract from each component of the vector.
		  * \return           New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion operator-(double pValue) const;

		/** Multiply all vector components by a value.
		  * \param pValue     The value multiplying each component of the vector.
		  * \return           New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion operator*(double pValue) const;

		/**	Divide all vector components by a value.
		  * \param pValue     The value dividing each component of the vector.
		  * \return           New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion operator/(double pValue) const;

		/** Add a value to all vector components.
		  * \param pValue     The value to add to each component of the vector.
		  * \return           The result of adding pValue to each component of the vector, replacing this dual quaternion.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion& operator+=(double pValue);

		/** Subtract a value from all vector components.
		  * \param pValue     The value to subtract from each component of the vector.
		  * \return           The result of subtracting pValue from each component of the vector, replacing this dual quaternion.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion& operator-=(double pValue);

		/** Multiply a value to all vector elements.
		  * \param pValue     The value multiplying each component of the vector.
		  * \return           The result of multiplying each component of the vector by pValue, replacing this dual quaternion.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion& operator*=(double pValue);

		/**	Divide all vector elements by a value.
		  * \param pValue     The value dividing each component of the vector.
		  * \return           The result of dividing each component of the vector by pValue, replacing this dual quaternion.
		  * \remarks          The passed value is not checked.
		  */
		FbxDualQuaternion& operator/=(double pValue);
	//@}

	/**
	  * \name Vector Operations
	  */
	//@{
		/**	Unary minus operator.
		  * \return      A dual quaternion where each component is multiplied by -1.
		  */
		FbxDualQuaternion operator-() const;

		/** Add two vectors together.
		  * \param pDualQuaternion     Dual quaternion to add.
		  * \return                The dual quaternion v' = this + pDualQuaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion operator+(const FbxDualQuaternion& pDualQuaternion) const;

		/** Subtract a quaternion from another quaternion.
		  * \param pDualQuaternion     Dual quaternion to subtract.
		  * \return                The dual quaternion v' = this - pDualQuaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion operator-(const FbxDualQuaternion& pDualQuaternion) const;

		/** Memberwise multiplication of two vectors.
		  * \param pDualQuaternion     Multiplying dual quaternion.
		  * \return                The dual quaternion v' = this * pQuaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion operator*(const FbxDualQuaternion& pDualQuaternion) const;

		/** Memberwise division of a dual quaternion with another dual quaternion.
		  * \param pDualQuaternion     Dividing dual quaternion.
		  * \return                The dual quaternion v' = this / pQuaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion operator/(const FbxDualQuaternion& pDualQuaternion) const;

		/** Add two quaternions together.
		  * \param pDualQuaternion     Dual quaternion to add.
		  * \return                The dual quaternion v' = this + pQuaternion, replacing this dual quaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion& operator+=(const FbxDualQuaternion& pDualQuaternion);

		/** Subtract a dual quaternion from another vector.
		  * \param pDualQuaternion     Dual quaternion to subtract.
		  * \return                The dual quaternion v' = this - pQuaternion, replacing this dual quaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion& operator-=(const FbxDualQuaternion& pDualQuaternion);

		/** Memberwise multiplication of two quaternions.
		  * \param pDualQuaternion     Multiplying dual quaternion.
		  * \return                The dual quaternion v' = this * pQuaternion, replacing this dual quaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion& operator*=(const FbxDualQuaternion& pDualQuaternion);

		/** Memberwise division of a dual quaternion by another dual quaternion.
		  * \param pDualQuaternion     Dividing dual quaternion.
		  * \return                The dual quaternion v' = this / pQuaternion, replacing this dual quaternion.
		  * \remarks               The values in pDualQuaternion are not checked.
		  */
		FbxDualQuaternion& operator/=(const FbxDualQuaternion& pDualQuaternion);

		/** Multiplication of a dual quaternion by a FbxVector4.
		* \param pVector     The FbxVector4 to multiply with.
		* \return            The dual quaternion v' = FbxDualQuaternion(mQ1, (mQ1 * pVector) + mQ2).
		* \remarks           The values in pDualQuaternion are not checked.
		*/
		FbxDualQuaternion operator*(const FbxVector4 pVector) const;

		/** Return dual quaternion product.
		* \param pDualQuaternion	Product dual quaternion.
		* \return					The dual quaternion that is the product of this and pDualQuaternion.
		*/
		FbxDualQuaternion Product(const FbxDualQuaternion& pDualQuaternion) const;

		/** Normalize the dual quaternion, length set to 1.
		*/
		void Normalize();

		/** Calculate the dual quaternion's inverse.
		* \return      The inverse of this dual quaternion. 
		*/
		void Inverse();

		/** Deform a point by this dual quaternion.
		* \return      The inverse of this quaternion. 
		*/
		FbxVector4 Deform(FbxVector4& pPoint);
	//@}

	/**
	* \name Conjugate Operations
	* \brief Dual quaternion has three types of conjugate.
	*/
	//@{
		/** Conjugate both quaternions of this dual quaternion.
		*/
		void Conjugate();

		/** Conjugate in dual space.
		*/
		void Dual();

		/** Conjugate both quaternions of this dual quaternion in dual space.
		*/
		void DualConjugate();
	//@}

	/**
	  * \name Boolean Operations
	  */
	//@{
		/**	Equivalence operator.
		  * \param pV     The quaternion to be compared to this quaternion.
		  * \return       \c true  if the two quaternions are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c false  otherwise.
		  */
		bool operator==(const FbxDualQuaternion & pV) const;

		/**	Non equivalence operator.
		  * \param pV     The quaternion to be compared to \e this.
		  * \return       \c  false if the two quaternions are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c true  otherwise.
		  */
		bool operator!=(const FbxDualQuaternion & pV) const;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	FbxQuaternion mQ1;
	FbxQuaternion mQ2;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_DUAL_QUATERNION_H_ */
