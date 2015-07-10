/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxnurbscurve.h
#ifndef _FBXSDK_SCENE_GEOMETRY_NURBS_CURVE_H_
#define _FBXSDK_SCENE_GEOMETRY_NURBS_CURVE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometry.h>
#include <fbxsdk/scene/geometry/fbxline.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**
    A Non-Uniform Rational B-Spline (NURBS) curve is a type of parametric geometry. A NURBS
    curve is defined by the order, form, knot vector and control points. 

	Let M be the order of the curve.
	Let N be the number of control points of the curve.

	The form of the curve can be open, closed or periodic. A curve with end points
	that do not meet is defined as an open curve. The number of knots in an open curve
	is defined as N+(M+1). 
	
	A closed curve simply has its last control point equal to its first control point. 
	Note that this does not imply tangent continuity at the end point.  The curve may 
	have a kink at this point.  In FBX the last control point is not specified by the user
	in the InitControlPoints() method. For example, if there are to be 10 control points in
	total, and the curve is to be closed, than only 9 control points need to be passed 
	into the InitControlPoints() method. The last control point is implied to be equal
	to the first control point. Thus N represents the number of unique CVs. 

	A periodic curve has its last M control points equal to its first M control points. 
	A periodic curve is tangent continuous at the ends. Similar to a closed curve,
	when creating a periodic curve, only the unique control points need to be set. For
	example a periodic curve of order 3 with 10 control points requires only 7 CVs to 
	be specified in the InitControlPoints() method. The last 3 CVs, which are the same as
	the first 3, are not included. 

	The calculation of the number of knots in closed and periodic curves is more complex. 
	Since we have excluded one CV in N in a closed curve, the number of knots is N+(M+1)+1. 
	Similarly, we excluded M CVs in periodic curves so the number of knots is N+(M+1)+M. 

	Note that FBX stores one extra knot at the beginning and and end of the knot vector,
	compared to some other graphics applications such as Maya. The two knots are not 
	used in calculation, but they are included so that no data is lost when converting
	from file formats that do store the extra knots.

  * \nosubgrouping
  */
class FBXSDK_DLL FbxNurbsCurve : public FbxGeometry 
{
	FBXSDK_OBJECT_DECLARE(FbxNurbsCurve,FbxGeometry);

public:
	//! Returns the EType::eNurbsCurve node attribute type.
	virtual FbxNodeAttribute::EType GetAttributeType() const;

	/** \enum EDimension        The dimension of the CVs.
	  * - \e e2D                The CVs are two dimensional points.
	  * - \e e3D                The CVs are three dimensional points.
	  */
	enum EDimension
	{
		e2D = 2,
		e3D
	};

	/** \enum EType             The curve's form.
	  * - \e eOpen
	  * - \e eClosed
	  * - \e ePeriodic
	  */
	enum EType
	{
		eOpen,
		eClosed,
		ePeriodic
	}; 

	/** Allocates memory space for the control points array as well as for the knot 
	  * vector.
      * \param pCount           Number of control points.
      * \param pVType           NURBS type.
	  * \remarks                This function should always be called after FbxNurbsCurve::SetOrder(). 
      */
	void InitControlPoints( int pCount, EType pVType );

	/** Returns the knot vector.
	  * \return                 Pointer to the knots array.
	  */
	inline double* GetKnotVector() const { return mKnotVector; }

	/** Returns the number of elements in the knot vector.
	  * \return                 The number of knots.
	  */
	int GetKnotCount() const;

	/** Sets the order of the curve.
      * \param pOrder           The curve order.
      * \remarks                The curve order must be set before InitControlPoints() is called. 
      */
	inline void SetOrder( int pOrder ) { mOrder = pOrder; }

	/** Returns the NURBS curve order.
	  * \return                 The NURBS curve order.
	  */
	inline int GetOrder() const { return mOrder; }

    /** Sets the step of the curve.
    * \param pStep            The curve step.
    * \remarks                To tessellate curve, it denotes the evaluation frequency between two neighbor knots.
    */
    inline void SetStep( int pStep ) { mStep = pStep; }

    /** Returns the NURBS curve step.
    * \return                 The NURBS curve step.
    * \remarks                To tessellate curve, it denotes the evaluation frequency between two neighbor knots.
    */
    inline int GetStep() const { return mStep; }

	/** Sets the dimension of the CVs.
	  * For 3D curves: control point = ( x, y, z, w ), where w is the weight.
	  * For 2D curves: control point = ( x, y, 0, w ), where the z component is unused, and w is the weight. 
	  * \param pDimension       The control points dimension(3D or 2D).
	  */
	inline void SetDimension( EDimension pDimension ) { mDimension = pDimension; }

	/** Returns the control points dimension.
	  * \return                 The curve dimension.
	  */
	inline EDimension GetDimension() const { return mDimension; }

	/** Determines if the curve is rational or not.
	  * \return                 \c True if the curve is rational, return \c false if not.
	  */
	bool IsRational(); 

	/** Calculates the number of curve spans with the following:
	  * Where
	  * S = Number of spans
	  * N = Number of CVs
	  * M = Order of the curve
	  *
	  * S = N - M + 1;
	  *
	  * In this calculation N includes the duplicate CVs for closed and periodic curves. 
	  * 
	  * \return                 The number of curve spans if the curve has been initialized, returns -1 if the curve has not been initialized.
	  */
	int GetSpanCount() const;

	/** Returns NURBS type.
	  * \return                 NURBS type identifier.
	  */
	inline EType GetType() const { return mNurbsType; }

	/** Checks if the curve is a poly line. (A poly line is a 
	  * linear NURBS curve )
	  *
	  * \return                 \c True if curve is a poly line, return \c false if it is not a poly line.
	  */
	inline bool IsPolyline() const { return ( GetOrder() == 2 ); }

	/** This function determines if this NURBS curve is a Bezier curve.
	  * Bezier curves are a special case of NURBS curve. 
	  * \return                 \c True if curve is a Bezier curve. If it is not a Bezier curve return \c false.
	  */
	bool IsBezier() const;

    /** Evaluate the point on the curve. Save the result as a point array. Meanwhile, return the length of the point array.
    * \param pPointArray           Save the evaluate result as a point array.
    * \param pStep                 The evaluation frequency between two neighbor knots. Its default value is 16, which is same as Maya.
    * \return The length of the point array.
    */
    int TessellateCurve(FbxArray<FbxVector4>& pPointArray, int pStep = 16);

    /** Evaluate the point on the curve. Per the evaluation result, create a FbxLine and return the pointer to the line.
    * \param pStep                 The evaluation frequency between two neighbor knots. Its default value is 16, which is same as Maya.
    * \return A line to hold the tessellate points.
    */
    FbxLine* TessellateCurve(int pStep = 16);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

	bool FullMultiplicity() const;

    // Error identifiers, these are only used internally.
	enum EErrorCode
	{
		eNurbsCurveTypeUnknown,
		eWeightTooSmall,
		eKnotVectorError,
        eWrongNumberOfControlPoint,
		eErrorCount
	};

	bool mIsRational;

    virtual void SetControlPointAt(const FbxVector4 &pCtrlPoint , int pIndex) { ParentClass::SetControlPointAt(pCtrlPoint, pIndex); }
    virtual void InitControlPoints(int pCount)                                { ParentClass::InitControlPoints(pCount);             }

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);

	void Reset();

private:
	double*		mKnotVector;
	EType		mNurbsType;
	int			mOrder;
	EDimension	mDimension; 
    int			mStep;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_NURBS_CURVE_H_ */
