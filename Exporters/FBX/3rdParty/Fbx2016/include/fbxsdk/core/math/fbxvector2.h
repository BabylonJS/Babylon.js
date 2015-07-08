/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxvector2.h
#ifndef _FBXSDK_CORE_MATH_VECTOR_2_H_
#define _FBXSDK_CORE_MATH_VECTOR_2_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	A two double mathematic vector class.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxVector2 : public FbxDouble2
{
public:
	/**
	  * \name Constructors and Destructor
	  */
	//@{
		//! Constructor.
		FbxVector2();

		/** Copy constructor.
		  * \param pVector2 The vector copied to this one.
		  */
		FbxVector2(const FbxVector2& pVector2);

		/** Constructor.
		  *	\param pX X component.
		  *	\param pY Y component.
		  */
		FbxVector2(double pX, double pY);
	//@}

	/**
	  * \name Access
	  */
	//@{
		/** Assignment operation.
		  * \param pVector2   The vector assigned to this one.
		  * \return           This vector after assignment. 
		  */
		FbxVector2& operator=(const FbxVector2& pVector2);

		/** Set vector.
	  * \param pX The X component value.
	  * \param pY The Y component value.
	  */
		void Set(double pX, double pY);
	//@}

	/**
	  * \name Scalar Operations
	  */
	//@{
		/** Add a value to all vector components.
		  * \param pValue The value to add to each component of the vector.
		  * \return           A new vector with the result of adding pValue to each component of this vector.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2 operator+(double pValue) const;

		/** Subtract a value from all vector components.
		  * \param pValue The value to subtract from each component of the vector.
		  * \return           A new vector with the result of subtracting pValue from each component of this vector.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2 operator-(double pValue) const;

		/** Multiply a value to all vector components.
		  * \param pValue The value multiplying each component of the vector.
		  * \return           A new vector with the result of multiplying each component of this vector by pValue.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2 operator*(double pValue) const;

		/**	Divide all vector components by a value.
		  * \param pValue The value dividing each component of the vector.
		  * \return           A new vector with the result of dividing each component of this vector by pValue.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2 operator/(double pValue) const;

		/** Add a value to all vector components.
		  * \param pValue The value to add to each component of the vector.
		  * \return           The result of adding pValue to each component of this vector, replacing this vector.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2& operator+=(double pValue);

		/** Subtract a value from all vector components.
		  * \param pValue The value to subtract from each component of the vector.
		  * \return           The result of subtracting pValue from each component of this vector, replacing this vector.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2& operator-=(double pValue);

		/** Multiply a value to all vector elements.
		  * \param pValue The value multiplying each component of the vector.
		  * \return           The result of multiplying each component of this vector by pValue, replacing this vector.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2& operator*=(double pValue);

		/**	Divide all vector elements by a value.
		  * \param pValue The value dividing each component of the vector.
		  * \return           The result of multiplying each component of this vector by pValue, replacing this vector.
		  * \remarks          The pValue parameter is not checked.
		  */
		FbxVector2& operator/=(double pValue);
	//@}

	/**
	  * \name Vector Operations
	  */
	//@{
		/**	Unary minus operator.
		  * \return The vector that is the negation of \c this.
		  */
		FbxVector2 operator-() const;

		/** Add two vectors together.
		  * \param pVector Vector to add.
		  * \return            The result of this vector + pVector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2 operator+(const FbxVector2& pVector) const;

		/** Subtract a vector from another vector.
		  * \param pVector Vector to subtract.
		  * \return            The result of this vector - pVector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2 operator-(const FbxVector2& pVector) const;

		/** Memberwise multiplication of two vectors.
		  * \param pVector      Multiplying vector.
		  * \return             The result of this vector * pVector.
		  * \remarks            The values in pVector are not checked.
		  */
		FbxVector2 operator*(const FbxVector2& pVector) const;

		/** Memberwise division of a vector with another vector.
		  * \param pVector     Dividing vector.
		  * \return            The result of this vector / pVector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2 operator/(const FbxVector2& pVector) const;

		/** Add two vectors together.
		  * \param pVector Vector to add.
		  * \return            The result of this vector + pVector, replacing this vector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2& operator+=(const FbxVector2& pVector);

		/** Subtract a vector from another vector.
		  * \param pVector Vector to subtract.
		  * \return            The result of this vector - pVector, replacing this vector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2& operator-=(const FbxVector2& pVector);

		/** Memberwise multiplication of two vectors.
		  * \param pVector Multiplying vector.
		  * \return            The result of this vector * pVector, replacing this vector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2& operator*=(const FbxVector2& pVector);

		/** Memberwise division of a vector with another vector.
		  * \param pVector Dividing vector.
		  * \remarks           The values in pVector are not checked.
		  * \return            The result of this vector / pVector, replacing this vector.
		  * \remarks           The values in pVector are not checked.
		  */
		FbxVector2& operator/=(const FbxVector2& pVector);

		/** Calculate the dot product of two vectors.
		  * \param pVector The second vector.
		  * \return The dot product value.
		  */
		double DotProduct(const FbxVector2& pVector) const;
	//@}

	/**
	  * \name Boolean Operations
	  */
	//@{
		/**	Equivalence operator.
		  * \param pVector The vector to be compared to \e this.
		  * \return            \c true if the two vectors are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c false otherwise.
		  */
		bool operator==(const FbxVector2 & pVector) const;

		/**	Non-equivalence operator.
		  * \param pVector The vector to be compared to \e this.
		  * \return            \c false if the two vectors are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c true otherwise.
		  */
		bool operator!=(const FbxVector2 & pVector) const;
	//@}

	/**
	  * \name Length
	  */
	//@{
		/** Get the vector's length.
		  * \return The mathematical length of the vector.
		  */
		double Length() const;

		/** Get the vector's length squared.
		  * \return The mathematical square length of the vector.
		  */
		double SquareLength() const;

		/** Find the distance between 2 vectors.
		  * \param pVector The second vector.
		  * \return The mathematical distance between the two vectors.
		  */
		double Distance(const FbxVector2& pVector) const;

		//! Normalize the vector, length set to 1.
		void Normalize();
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
	* \param pSize The number of element to test, starting at beginning. Value must range between [1, 2].
	* \return \c true if all elements of the vector are zero, \c false otherwise. */
	bool IsZero(int pSize=2) const;

	// Fix value like 1.#IND, 1.#INF, nan, and inf
	void FixIncorrectValue();
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_VECTOR_2_H_ */
