/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxaffinematrix.h
#ifndef _FBXSDK_CORE_MATH_AFFINE_MATRIX_H_
#define _FBXSDK_CORE_MATH_AFFINE_MATRIX_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxvector4.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**	FBX SDK affine matrix class.
  * \nosubgrouping
  * Matrices are defined using the Column Major scheme. When a FbxAMatrix represents a transformation (translation, rotation and scale), 
  * the last row of the matrix represents the translation part of the transformation.
  *
  * \remarks It is important to realize that an affine matrix must respect a certain structure.  To be sure the structure is respected,
  * use SetT, SetR, SetS, SetQ, SetTRS or SetTQS.  If by mistake bad data is entered in this affine matrix, some functions such as 
  * Inverse() will yield wrong results.  If a matrix is needed to hold values that aren't associate with an affine matrix, please use FbxMatrix instead.
  */
class FBXSDK_DLL FbxAMatrix : public FbxDouble4x4
{
public:
	/**
	  * \name Constructors and Destructor
	  */
	//@{
		//! Constructor.
		FbxAMatrix();

		/** Copy constructor.
		  * \param pOther FbxAMatrix copied to this one.
		  */
		FbxAMatrix(const FbxAMatrix& pOther);

		/** Constructor.
		  *	\param pT     Translation vector.
		  *	\param pR     Euler rotation vector.
		  *	\param pS     Scale vector.
		  */
		FbxAMatrix(const FbxVector4& pT, const FbxVector4& pR, const FbxVector4& pS);

		//! Destructor.
		~FbxAMatrix();
	//@}

	/**
	  * \name Access
	  */
	//@{
		/** Retrieve matrix element.
		  *	\param pY     Row index.
		  *	\param pX     Column index.
		  * \return       Cell [ pX, pY ] value.
		  */
		double Get(int pY, int pX) const;

		/** Extract translation vector.
		  * \return     Translation vector.
		  */
		FbxVector4 GetT() const;

		/** Extract rotation vector.
		  * \return     Rotation vector.
		  * \remarks    The returned rotation vector is in Euler angle and the rotation order is XYZ.
		  */
		FbxVector4 GetR() const;

		/** Extract quaternion vector.
		  * \return     Quaternion vector.
		  */
		FbxQuaternion GetQ() const;

		/** Extract scale vector.
		  * \return     Scale vector.
		  */
		FbxVector4 GetS() const;

		/** Extract a row vector.
		  *	\param pY     Row index.
		  * \return       The row vector.
		  */
		FbxVector4 GetRow(int pY) const;

		/** Extract a column vector.
		  *	\param pX     Column index.
		  * \return       The column vector.
		  */
		FbxVector4 GetColumn(int pX) const;

		//! Set matrix to identity.
		void SetIdentity();

		/** Set matrix's translation.
		  * \param pT     Translation vector.
		  */
		void SetT(const FbxVector4& pT);

		/** Set matrix's Euler rotation.
		  * \param pR     X, Y and Z rotation values expressed as a vector.
		  * \remarks      The rotation transform is constructed in rotation order XYZ.
		  */
		void SetR(const FbxVector4& pR);

		/** Set matrix's quaternion.
		  * \param pQ     The new quaternion.
		  */
		void SetQ(const FbxQuaternion& pQ);

		/** Set matrix's scale.
		  * \param pS     X, Y and Z scaling factors expressed as a vector.
		  */
		void SetS(const FbxVector4& pS);

		/** Set matrix.
		  *	\param pT     Translation vector.
		  *	\param pR     Rotation vector.
		  *	\param pS     Scale vector.
		  */
		void SetTRS(const FbxVector4& pT, const FbxVector4& pR, const FbxVector4& pS);

		/** Set matrix.
		  *	\param pT     Translation vector.
		  *	\param pQ     Quaternion vector.
		  *	\param pS     Scale vector.
		  */
		void SetTQS(const FbxVector4& pT, const FbxQuaternion& pQ, const FbxVector4& pS);

		/** Assignment operator.
		  * \param pM FbxAMatrix assigned to this one.
		  */
		FbxAMatrix& operator=(const FbxAMatrix& pM);
	//@}

	/**
	  * \name Scalar Operations
	  */
	//@{
		/** Multiply matrix by a scalar value.
		  * \param pValue     Scalar value.
		  * \return           The scaled matrix.
		  * \remarks          The passed value is not checked. 
		  *                   This operator operates on the first three rows and columns of the matrix. 
		  *                   So only the rotation and scaling are scaled, not the translation part.
		  *                   After operation, the translation vector will be set as (0,0,0,1);
		  */
		FbxAMatrix operator*(double pValue) const;

		/** Divide matrix by a scalar value.
		  * \param pValue     Scalar value.
		  * \return           The divided matrix.
		  * \remarks          The passed value is not checked.
		  *                   This operator operates on the first three rows and columns of the matrix. 
		  *                   So only the rotation and scaling are scaled, not the translation part. 
		  *                   After operation, the translation vector will be set as (0,0,0,1);
		  */
		FbxAMatrix operator/(double pValue) const;

		/** Multiply matrix by a scalar value.
		  * \param pValue     Scalar value.
		  * \return           \e this updated with the result of the multiplication.
		  * \remarks          The passed value is not checked.
		  *                   This operator operates on the first three rows and columns of the matrix. 
		  *                   So only the rotation and scaling are scaled, not the translation part. 
		  *                   After operation, the translation vector will keep original value.
		  */
		FbxAMatrix& operator*=(double pValue);

		/** Divide matrix by a scalar value.
		  * \param pValue     Scalar value.
		  * \return           \e this updated with the result of the division.
		  * \remarks          The passed value is not checked.
		  *                   This operator operates on the first three rows and columns of the matrix. 
		  *                   So only the rotation and scaling are scaled, not the translation part. 
		  *                   After operation, the translation vector will keep original value.
		  */
		FbxAMatrix& operator/=(double pValue);
	//@}

	/**
	  * \name Vector Operations
	  */
	//@{
		/** Multiply matrix by a translation vector.
		  * \param pVector4     Translation vector.
		  * \return             t' = M * t
		  */
		FbxVector4 MultT(const FbxVector4& pVector4) const;

		/** Multiply matrix by an Euler rotation vector.
		  * \param pVector4     Euler Rotation vector.
		  * \return             r' = M * r
		  */
		FbxVector4 MultR(const FbxVector4& pVector4) const;
		
		/** Multiply matrix by a quaternion.
		  * \param pQuaternion     Rotation value.
		  * \return                q' = M * q
		  */
		FbxQuaternion MultQ(const FbxQuaternion& pQuaternion) const;

		/** Multiply matrix by a scale vector.
		  * \param pVector4     Scaling vector.
		  * \return             s' = M * s
		  */
		FbxVector4 MultS(const FbxVector4& pVector4) const;
	//@}

	/**
	  * \name Matrix Operations
	  */
	//@{	
		/**	Unary minus operator.
		  * \return     A matrix where each element is multiplied by -1.
		  */
		FbxAMatrix operator-() const;
		
		/** Multiply two matrices together.
		  * \param pOther     A Matrix.
		  * \return             this * pMatrix.
		  * \remarks            Transformations are pre-multiplied.
		  *  That means to scale, then rotate, and then translate a vector V, the transform should be T * R * S * V. \n
		  *  Below is an example of code that shows how to construct rotation transform in XYZ rotation order.
		  *  \code
		  *  FbxAMatrix lRotateXM, lRotateYM, lRotateZM, lRotateXYZM, lRotateM;
		  *  // Construct rotation matrix around X, Y and Z axises separately and then combine them.
		  *  FbxVector4 lRotateX(10, 0, 0);
		  *  FbxVector4 lRotateY(0, 10, 0);
		  *  FbxVector4 lRotateZ(0, 0, 10);
		  *  lRotateXM.SetR(lRotateX);
		  *  lRotateYM.SetR(lRotateY);
		  *  lRotateZM.SetR(lRotateZ);
		  *  lRotateXYZM = lRotateZM * lRotateYM * lRotateXM;
		  *
		  *  // Alternatively, we can use SetR() directly.
		  *  // lRotateXYZM and lRotateM will be the same.
		  *  FbxVector4 lRotateXYZ (10, 10, 10);
		  *  lRotateM.SetR(lRotateXYZ);
		  *  \endcode
		  * \note                Please refer to the FBX SDK programmers guide for more details.
		  */
		FbxAMatrix operator*(const FbxAMatrix& pOther) const;

		/** Multiply two matrices together.
		  * \param pOther     A Matrix.
		  * \return             \e this updated with the result of the multiplication.
		  */
		FbxAMatrix& operator*=(const FbxAMatrix& pOther);

		/** Calculate the matrix inverse.
		  * \return     The inverse matrix of \e this.
		  */
		FbxAMatrix Inverse() const;

		/** Calculate the matrix transpose.
		  * \return     The transposed matrix of \e this.
		  */
		FbxAMatrix Transpose() const;

		/** Calculate a spherical linear interpolation matrix.
		* \param pOther The other rotation matrix to interpolate with.
		* \param pWeight A value between 0.0 and 1.0 to specify the interpolation amount.
		* \remark This matrix and other matrix should contain only rotations, otherwise result may be undefined. */
		FbxAMatrix Slerp(const FbxAMatrix& pOther, double pWeight) const;
	//@}

	/**
	  * \name Boolean Operations
	  */
	//@{
		/**	Equivalence operator.
		  * \param pOther     The matrix to be compared to \e this.
		  * \return             \c true if the two matrices are equal (each element is within a FBXSDK_TOLERANCE tolerance) and \c false otherwise.
		  */
		bool operator==(const FbxAMatrix& pOther) const;

		/**	Non-equivalence operator.
		  * \param pOther     The matrix to be compared to \e this.
		  * \return            \c false if the two matrices are equal (each element is within a FBXSDK_TOLERANCE tolerance) and \c true otherwise.
		  */
		bool operator!=(const FbxAMatrix& pOther) const;
	//@}

	/**
	  * \name Casting
	  */
	//@{
		//! Cast the matrix in a double pointer.
		operator double* ();
		//! Cast the matrix in a const double pointer.
		operator const double* () const;
		//! Define 4*4 array as a new type 
		typedef const double(kDouble44)[4][4] ;
		//! Cast the matrix in a reference to a 4*4 array.
		inline kDouble44 & Double44() const { return *((kDouble44 *)&mData[0][0]); }
	//@}

	/** Find out if the matrix is equal to identity matrix.
	* \return \c true if the matrix is equal to identity matrix, \c false otherwise. */
	bool IsIdentity(const double pThreshold=FBXSDK_TOLERANCE);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxAMatrix(const FbxVector4& pT, const FbxQuaternion& pQ, const FbxVector4& pS);

	void SetTRS(const FbxVector4& pT, const FbxAMatrix& pRM, const FbxVector4& pS);
    void SetRow(int pY, const FbxVector4& pRow);
    void SetTOnly(const FbxVector4& pT);
    void SetROnly(const FbxVector4& pR);
    void SetQOnly(const FbxQuaternion& pQ);
	FbxVector4 GetROnly() const;
    FbxQuaternion GetUnnormalizedQ() const;

	// pOrd is assumed to be an FbxEuler::EOrder (or its synonym EFbxRotationOrder)
    void SetR(const FbxVector4& pV, const int pOrd); 
	FbxVector4 GetR(const int pOrd) const;

    void MultRM(const FbxVector4& pR);
    void MultSM(const FbxVector4& pS);
    bool IsRightHand() const;
    double Determinant() const;
	int Compare(const FbxAMatrix pM, const double pThreshold=FBXSDK_TOLERANCE) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MATH_AFFINE_MATRIX_H_ */
