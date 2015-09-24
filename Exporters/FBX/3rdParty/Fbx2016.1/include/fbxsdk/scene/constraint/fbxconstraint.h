/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxconstraint.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_H_
#define _FBXSDK_SCENE_CONSTRAINT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/fbxsdk_nsbegin.h>

/** Base class for weighted animation constraints.
  * Constraints are primarily used to impose limits on properties of objects (e.g. position, orientation, scale)
  * and to automate animation processes.
  * A <b>constrained object</b> is an object with properties constrained by one or more weighted <b>constraint source</b>s.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxConstraint : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxConstraint, FbxObject);

public:
    /**
      * \name Properties
      */
    //@{
        /** This property represents the degree of influence of a constraint from 0.0 (no influence) to 100.0 (full influence).
          *
          * Default value is 100.0.
          */
        FbxPropertyT<FbxDouble> Weight;

        /** This property controls whether the constraint is applied or not.
          * If the value is \c false the constraint will have no effect. The default value is \c true.
          *
          * Default value is true.
          */
        FbxPropertyT<FbxBool> Active;

        /** This property handles the lock state of the constraint.
          *
          * When enabled, the constrained object cannot be moved away from its constrained location when the constraint is active.
          *
          * Default value is false.
          */
        FbxPropertyT<FbxBool> Lock;
    //@}

    /** \enum EType Constraint attribute types.
      */
    enum EType
    {
        eUnknown,			//! Invalid constraint.
        ePosition,			//! Position constraint (referred to as a point constraint in Maya).
        eRotation,			//! Rotation constraint (referred to as an orient constraint in Maya).
        eScale,				//! Scale constraint.
        eParent,			//! Parent constraint.
        eSingleChainIK,		//! Single chain IK constraint.
        eAim,				//! Aim constraint.
        eCharacter,			//! Character constraint.
        eCustom				//! User defined constraints.
    };

    /** Access the type of the constraint.
      * \return This type of the constraint.
      */
    virtual EType GetConstraintType() const { return eUnknown; }

    /** Retrieve the constrained object.
      * \return The constrained object.
      */
    virtual FbxObject* GetConstrainedObject() const { return NULL; }

    /** Retrieve the count of constraint source.
      * \return The count of constraint source.
      */
    virtual int GetConstraintSourceCount() const { return 0; }

    /** Retrieve a constraint source with the specified index.
      * \param pIndex The specified index.
      * \return The constraint source at the specified index.
      */
    virtual FbxObject* GetConstraintSource(int /*pIndex*/) const { return NULL; }

    /** Get the weight associated with a constraint source.
      * \param pObject The given constraint source.
      * \return The weight of the constraint source.
      */
    double GetSourceWeight(const FbxObject* pObject) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

const FbxString GetWeightPropertyName(const FbxObject * pObject);
void CreateWeightPropertyForSourceObject(FbxObject * pConstraint, const FbxObject * pSourceObject, double pWeightValue);

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_H_ */
