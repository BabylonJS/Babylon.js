/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxvector4.h
#ifndef _FBXSDK_CORE_MATH_VECTOR_4_H_
#define _FBXSDK_CORE_MATH_VECTOR_4_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxQuaternion;

/**	A four double mathematic vector class.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxVector4 : public FbxDouble4
{
public:
	/**
	  * \name Constructors and Destructor
	  */
	//@{
		//! Constructor.
		FbxVector4();

		/** Copy constructor.
		  * \param pVector4   The vector copied to this one.
		  */
		FbxVector4(const FbxVector4& pVector4);

		/** Constructor.
		  *	\param pX X component.
		  *	\param pY Y component.
		  *	\param pZ Z component.
		  *	\param pW W component.
		  */
		FbxVector4(double pX, double pY, double pZ, double pW=1.0);

		/** Constructor.
		  *	\param pValue X,Y,Z,W components.
		  */
		FbxVector4(const double pValue[4]);

		/** Constructor.
		  * \param pValue X,Y,Z components.
		  * \remarks The fourth component of this object is assigned 1.
		  */
		FbxVector4(const FbxDouble3& pValue);
	//@}

	/**
	  * \name Access
	  */
	//@{
		/** Assignment operation.
		  * \param pVector4  The vector assigned to this one.
		  * \return          This vector after assignment.
		  */
		FbxVector4& operator=(const FbxVector4& pVector4);

		/** Assignment operation.
		  * \param pValue    The pointer to an array whose elements are assigned to this vector.
		  * \return          This vector after assignment.
		  */
		FbxVector4& operator=(const double* pValue);

		/** Assignment operation.
		  * \param pValue    The vector with 3 elements assigned to this vector.
		  * \return          This vector after assignment.
		  * \remarks         The first three elements are assigned with pValue. The fourth element is set as 1.0 
		  */
		FbxVector4& operator=(const FbxDouble3& pValue);

		/** Set vector.
		  * \param pX The X component value.
		  * \param pY The Y component value.
		  * \param pZ The Z component value.
		  * \param pW The W component value.
		  */
		void Set(double pX, double pY, double pZ, double pW=1.0);
	//@}

	/**
	  * \name Scalar Operations
	  */
	//@{
		/** Add a value to all vector components.
		  * \param pValue The value to add to each component of the vector.
		  * \return New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4 operator+(double pValue) const;

		/** Subtract a value from all vector components.
		  * \param pValue The value to subtract from each component of the vector.
		  * \return New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4 operator-(double pValue) const;

		/** Multiply a value to all vector components.
		  * \param pValue The value multiplying each component of the vector.
		  * \return New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4 operator*(double pValue) const;

		/**	Divide all vector components by a value.
		  * \param pValue The value dividing each component of the vector.
		  * \return New vector.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4 operator/(double pValue) const;

		/** Add a value to all vector components.
		  * \param pValue The value to add to each component of the vector.
		  * \return \e this updated with the operation result.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4& operator+=(double pValue);

		/** Subtract a value from all vector components.
		  * \param pValue The value to subtract from each component of the vector.
		  * \return \e this updated with the operation result.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4& operator-=(double pValue);

		/** Multiply a value to all vector elements.
		  * \param pValue The value multiplying each component of the vector.
		  * \return \e this updated with the operation result.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4& operator*=(double pValue);

		/**	Divide all vector elements by a value.
		  * \param pValue The value dividing each component of the vector.
		  * \return \e this updated with the operation result.
		  * \remarks          The passed value is not checked.
		  */
		FbxVector4& operator/=(double pValue);
	//@}

	/**
	  * \name Vector Operations
	  */
	//@{
		/**	Unary minus operator.
		  * \return The vector that is the negation of \c this.
		  */
		FbxVector4 operator-() const;

		/** Add two vectors together.
		  * \param pVector Vector to add.
		  * \return The vector v' = this + pVector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4 operator+(const FbxVector4& pVector) const;

		/** Subtract a vector from another vector.
		  * \param pVector Vector to subtract.
		  * \return The vector v' = this - pVector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4 operator-(const FbxVector4& pVector) const;

		/** Memberwise multiplication of two vectors.
		  * \param pVector Multiplying vector.
		  * \return The vector v' = this * pVector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4 operator*(const FbxVector4& pVector) const;

		/** Memberwise division of a vector with another vector.
		  * \param pVector Dividing vector.
		  * \return The vector v[i]' = this[i] / pVector[i].
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4 operator/(const FbxVector4& pVector) const;

		/** Add two vectors together.
		  * \param pVector Vector to add.
		  * \return \e this updated with the operation result.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4& operator+=(const FbxVector4& pVector);

		/** Subtract a vector from another vector.
		  * \param pVector Vector to subtract.
		  * \return \e this updated with the operation result.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4& operator-=(const FbxVector4& pVector);

		/** Memberwise multiplication of two vectors.
		  * \param pVector Multiplying vector.
		  * \return \e this updated with the operation result.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4& operator*=(const FbxVector4& pVector);

		/** Memberwise division of a vector with another vector.
		  * \param pVector Dividing vector.
		  * \return \e this updated with the operation result.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector4& operator/=(const FbxVector4& pVector);

		/** Calculate the dot product of two vectors.
		  * \param pVector The second vector.
		  * \return The dot product value.
		  * \remarks           Being considered as a XYZ vector with a weight, only the 3 first elements are considered in this operation.
		  */
		double DotProduct(const FbxVector4& pVector) const;

		/** Calculate the cross product of two vectors.
		  * \param pVector The second vector.
		  * \return The cross product vector.
		  * \remarks           Being considered as a XYZ vector with a weight, only the first 3 elements are considered in this operation.
		  */
		FbxVector4 CrossProduct(const FbxVector4& pVector) const;

		/** Calculate the Euler rotation required to align axis pAB-pA on pAB-pB.
		  *	\param pAB The intersection of the 2 axis.
		  *	\param pA A point on axis to be aligned.
		  *	\param pB A point on reference axis.
		  *	\param pAngles Resulting euler angles.
		  *	\return \c true on success.
		  * \remarks           Being considered as a XYZ vector with a weight, only the first 3 elements are considered in this operation.
		  */
		static bool AxisAlignmentInEulerAngle(const FbxVector4& pAB, const FbxVector4& pA, const FbxVector4& pB, FbxVector4& pAngles);
	//@}

	/**
	  * \name Boolean Operations
	  */
	//@{
		/**	Equivalence operator.
		  * \param pVector The vector to be compared to \e this.
		  * \return            \c true if the two vectors are equal (each element is within a FBXSDK_TOLERANCE tolerance) and \c false otherwise.
		  */
		bool operator==(const FbxVector4 & pVector) const;

		/**	Non equivalence operator.
		  * \param pVector The vector to be compared to \e this.
		  * \return            \c false if the two vectors are equal (each element is within a FBXSDK_TOLERANCE tolerance) and \c true otherwise.
		  */
		bool operator!=(const FbxVector4 & pVector) const;
	//@}

	/**
	  * \name Length
	  */
	//@{
		/** Get the vector's length.
		  * \return The mathematical length of the vector.
		  * \remarks     Being considered as a XYZ vector with a weight, only the first 3 elements are considered in this operation.
		  */
		double Length() const;

		/** Get the vector's length squared.
		  * \return The mathematical square length of the vector.
		  * \remarks     Being considered as a XYZ vector with a weight, only the first 3 elements are considered in this operation.
		  */
		double SquareLength() const;

		/** Find the distance between 2 vectors.
		  * \param pVector The second vector.
		  * \return The mathematical distance between the two vectors.
		  * \remarks           Being considered as a XYZ vector with a weight, only the 3 first elements are considered in this operation.
		  */
		double Distance(const FbxVector4& pVector) const;

		/** Normalize the vector, length set to 1.
		  * \remarks     Being considered as a XYZ vector with a weight, only the first 3 elements are considered in this operation.
		  */
		void Normalize();


		/** Set the Euler XYZ from a Quaternion.
		  *\param pQuat    Quaternion from which Euler XYZ information is got.
		  */
		void SetXYZ(const FbxQuaternion pQuat);
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

	/** Find out if the vector is equal to zero.
	* \param pSize The number of element to test, starting at beginning. Value must range between [1, 4].
	* \return \c true if all elements of the vector are zero, \c false otherwise. */
	bool IsZero(int pSize=4) const;

	// Fix value like 1.#IND, 1.#INF, nan, and inf
	void FixIncorrectValue();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	int Compare(const FbxVector4& pV, const double pThreshold=FBXSDK_TOLERANCE) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_VECTOR_4_H_ */
