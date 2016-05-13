/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmatrix.h
#ifndef _FBXSDK_CORE_MATH_MATRIX_H_
#define _FBXSDK_CORE_MATH_MATRIX_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxvector4.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxAMatrix;

/**	FBX SDK basic 4x4 double matrix class.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxMatrix : public FbxDouble4x4
{
public:
	//! \name Constructors and Destructor
	//@{
		//! Constructor (initialize to an identity matrix)
		FbxMatrix();

		/** Copy constructor.
		* \param pM Another FbxMatrix object copied to this one. */
		FbxMatrix(const FbxMatrix& pM);

		/** Copy constructor for affine matrix.
		* \param pM Affine matrix */
		FbxMatrix(const FbxAMatrix& pM);

		/** TRS Constructor.
		* \param pT Translation vector.
		* \param pR Euler rotation vector.
		* \param pS Scale vector. */
		FbxMatrix(const FbxVector4& pT, const FbxVector4& pR, const FbxVector4& pS);

		/** TQS Constructor.
		* \param pT Translation vector.
		* \param pQ Quaternion.
		* \param pS Scale vector. */
		FbxMatrix(const FbxVector4& pT, const FbxQuaternion& pQ, const FbxVector4& pS);

		/** 16 double constructor.
		* \param p00 Value at column 0 row 0.
		* \param p10 Value at column 1 row 0.
		* \param p20 Value at column 2 row 0.
		* \param p30 Value at column 3 row 0.
		* \param p01 Value at column 0 row 1.
		* \param p11 Value at column 1 row 1.
		* \param p21 Value at column 2 row 1.
		* \param p31 Value at column 3 row 1.
		* \param p02 Value at column 0 row 2.
		* \param p12 Value at column 1 row 2.
		* \param p22 Value at column 2 row 2.
		* \param p32 Value at column 3 row 2.
		* \param p03 Value at column 0 row 3.
		* \param p13 Value at column 1 row 3.
		* \param p23 Value at column 2 row 3.
		* \param p33 Value at column 3 row 3. */
		FbxMatrix(	const double p00, const double p10, const double p20, const double p30,
					const double p01, const double p11, const double p21, const double p31,
					const double p02, const double p12, const double p22, const double p32,
					const double p03, const double p13, const double p23, const double p33);
			
		//! Destructor.
		~FbxMatrix();
	//@}

	//! \name Access
	//@{
		/** Retrieve matrix element.
		* \param pY Row index.
		* \param pX Column index.
		* \return Value at element [ pX, pY ] of the matrix. */
		double Get(int pY, int pX) const;

		/** Extract a row vector.
		* \param pY Row index.
		* \return The row vector. */
		FbxVector4 GetRow(int pY) const;

		/** Extract a column vector.
		* \param pX Column index.
		* \return The column vector. */
		FbxVector4 GetColumn(int pX) const;

		/** Set matrix element.
		* \param pY Row index.
		* \param pX Column index.
		* \param pValue New component value. */
		void Set(int pY, int pX, double pValue);

		/** Set matrix.
		* \param pT Translation vector.
		* \param pR Euler rotation vector.
		* \param pS Scale vector. */
		void SetTRS(const FbxVector4& pT, const FbxVector4& pR, const FbxVector4& pS);

		/** Set matrix.
		* \param pT Translation vector.
		* \param pQ Quaternion.
		* \param pS Scale vector. */
		void SetTQS(const FbxVector4& pT, const FbxQuaternion& pQ, const FbxVector4& pS);

		/** Set a matrix row.
		* \param pY Row index.
		* \param pRow Row vector. */
		void SetRow(int pY, const FbxVector4& pRow);

		/** Set a matrix column.
		* \param pX Column index.
		* \param pColumn Column vector. */
		void SetColumn(int pX, const FbxVector4& pColumn);

		/** Decompose the affine matrix into elements of translation, rotation, shearing, scaling and sign of determinant.
		* \param pTranslation Translation element.
		* \param pRotation Rotation element.
		* \param pShearing Shearing element.
		* \param pScaling Scaling element.
		* \param pSign Sign of determinant. */
		void GetElements(FbxVector4& pTranslation, FbxQuaternion& pRotation, FbxVector4& pShearing, FbxVector4& pScaling, double& pSign) const;
		
		/** Decompose the affine matrix into elements of translation, rotation, shearing, scaling and sign of determinant.
		* \param pTranslation Translation element.
		* \param pRotation Rotation element.
		* \param pShearing Shearing element.
		* \param pScaling Scaling element.
		* \param pSign Sign of determinant. */
		void GetElements(FbxVector4& pTranslation, FbxVector4& pRotation, FbxVector4& pShearing, FbxVector4& pScaling, double& pSign) const;
	//@}

	//! \name Operators
	//@{
		/** Assignment operator.
		* \param pMatrix Source matrix. */
		FbxMatrix& operator=(const FbxMatrix& pMatrix);

		/**	Unary minus operator.
		* \return A matrix where each element is multiplied by -1. */
		FbxMatrix operator-() const;

		/** Add two matrices together.
		* \param pMatrix A matrix.
		* \return The result of this matrix + pMatrix. */
		FbxMatrix operator+(const FbxMatrix& pMatrix) const;

		/** Subtract a matrix from another matrix.
		* \param pMatrix A matrix.
		* \return The result of this matrix - pMatrix. */
		FbxMatrix operator-(const FbxMatrix& pMatrix) const;

		/** Multiply two matrices.
		* \param pMatrix A matrix.
		* \return The result of this matrix * pMatrix. */
		FbxMatrix operator*(const FbxMatrix& pMatrix) const;

		/** Add two matrices together.
		* \param pMatrix A matrix.
		* \return The result of this matrix + pMatrix, replacing this matrix. */
		FbxMatrix& operator+=(const FbxMatrix& pMatrix);

		/** Subtract a matrix from another matrix.
		* \param pMatrix A matrix.
		* \return The result of this matrix - pMatrix, replacing this matrix. */
		FbxMatrix& operator-=(const FbxMatrix& pMatrix);

		/** Multiply two matrices.
		* \param pMatrix A matrix.
		* \return The result of this matrix * pMatrix, replacing this matrix. */
		FbxMatrix& operator*=(const FbxMatrix& pMatrix);

		/**	Equivalence operator.
		* \param pM The matrix to be compared against this matrix.
		* \return \c true if the two matrices are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c false otherwise. */
		bool operator==(const FbxMatrix& pM) const;

		/**	Equivalence operator.
		* \param pM The affine matrix to be compared against this matrix.
		* \return \c true if the two matrices are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c false otherwise. */
		bool operator==(const FbxAMatrix& pM) const;

		/**	Non-equivalence operator.
		* \param pM The matrix to be compared against this matrix.
		* \return \c false if the two matrices are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c true otherwise. */
		bool operator!=(const FbxMatrix& pM) const;

		/**	Non-equivalence operator.
		* \param pM The affine matrix to be compared against this matrix.
		* \return \c false if the two matrices are equal (each element is within a FBXSDK_TOLERANCE tolerance), \c true otherwise. */
		bool operator!=(const FbxAMatrix& pM) const;
	//@}

	//! \name Casting
	//@{
		//! Cast the vector in a double pointer.
		operator double* ();

		//! Cast the vector in a const double pointer.
		operator const double* () const;

		//! Define 4*4 array as a new type.
		typedef const double(kDouble44)[4][4] ;

		//! Cast the matrix in a reference to a 4*4 array.
		inline kDouble44 & Double44() const { return *((kDouble44 *)&mData[0][0]); }
	//@}

	//! \name Math Operations
	//@{
		/** Calculate the matrix inverse.
		* \return The inverse matrix. */
		FbxMatrix Inverse() const;

		/** Calculate the matrix transpose.
		* \return This matrix transposed. */
		FbxMatrix Transpose() const;

		//! Set matrix to identity.
		void SetIdentity();

		/** Set the matrix to a "Look To" left handed.
		* \param pEyePosition The position of the eye.
		* \param pEyeDirection The direction of the eye.
		* \param pUpDirection The up direction of the eye. */
		void SetLookToLH(const FbxVector4& pEyePosition, const FbxVector4& pEyeDirection, const FbxVector4& pUpDirection);

		/** Set the matrix to a "Look To" right handed.
		* \param pEyePosition The position of the eye.
		* \param pEyeDirection The direction of the eye.
		* \param pUpDirection The up direction of the eye. */
		void SetLookToRH(const FbxVector4& pEyePosition, const FbxVector4& pEyeDirection, const FbxVector4& pUpDirection);

		/** Set the matrix to a "Look At" left handed.
		* \param pEyePosition The position of the eye.
		* \param pLookAt The look at position of the eye focus.
		* \param pUpDirection The up direction of the eye. */
		void SetLookAtLH(const FbxVector4& pEyePosition, const FbxVector4& pLookAt, const FbxVector4& pUpDirection);

		/** Set the matrix values as a "Look At" right handed.
		* \param pEyePosition The position of the eye.
		* \param pLookAt The look at position of the eye focus.
		* \param pUpDirection The up direction of the eye. */
		void SetLookAtRH(const FbxVector4& pEyePosition, const FbxVector4& pLookAt, const FbxVector4& pUpDirection);

		/** Multiply this matrix by pVector, the w component is normalized to 1.
		* \param pVector A vector.
		* \return The result of this matrix * pVector. */
		FbxVector4 MultNormalize(const FbxVector4& pVector) const;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	int Compare(const FbxMatrix pM, const double pThreshold = FBXSDK_TOLERANCE) const;
	int Compare(const FbxAMatrix pM, const double pThreshold = FBXSDK_TOLERANCE) const;

	FbxMatrix operator*(double pValue) const;
	FbxMatrix& operator*=(double pValue);

    double LUDecomposition(FbxVector4& pVector);
    FbxMatrix LUMult(FbxMatrix pM, const FbxVector4& pVector) const;
    double Determinant() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_MATRIX_H_ */
