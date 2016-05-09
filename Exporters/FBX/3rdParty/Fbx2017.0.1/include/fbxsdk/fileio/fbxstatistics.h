/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxstatistics.h
#ifndef _FBXSDK_FILEIO_STATISTICS_H_
#define _FBXSDK_FILEIO_STATISTICS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/**  This class is a basic class to get the quantity of items.
  *  User processes the statistics raw data by deriving FbxStatistics class and overrides \c AddItem method.
  *  When overriding \c AddItem method, User must store item's name and item's count by pair which means
  *  The index of one item's name in array \c mItemName is the same as the index of this item's count in array \c mItemCount.
  *
  * \code Here is a code snippet to show how it used.
  * //Define my own statistics class.
  * class MyStatistics : public FbxStatistics
  * {
  *  public:
        virtual bool AddItem(FbxString& pItemName, int pItemCount)
        {
            mItemName.Add( FbxSdkNew< FbxString >(pItemName) );
            mItemCount.Add( pItemCount);
            return true;
        };
  * };
  * 
  * FbxManager* lSdkManager = FbxManager::Create(); 
  * FbxScene*      lScene      = FbxScene::Create( lSdkManager, "Scene");
  * FbxNode*       lNode1      = FbxNode::Create(lScene, "Node1");
  * FbxNode*       lNode2      = FbxNode::Create(lScene, "Node2");
  * FbxNode*       lNode3      = FbxNode::Create(lScene, "Node3");
  * FbxNode*       lNode4      = FbxNode::Create(lScene, "Node4");
  * lScene.AddNode(lNode1);
  * lScene.AddNode(lNode2);
  * lScene.AddNode(lNode3);
  * MyStatistics lStatistics;
  * lStatistics.AddItem("Node_Count", lScene.GetNodeCount() );
  * FbxString lItemName;
  * int     lItemCount;
  * if( lStatistics.GetItemPair( 0, lItemName, lItemCount))
  * {
  *     //do something
  * }
  * \endcode

  * \nosubgrouping
  */
class FBXSDK_DLL FbxStatistics
{
public:
    /// \name Constructor and Destructor.
    //@{
    FbxStatistics();
    virtual ~FbxStatistics();
    //@}

    //! Reset the statistics.
    void Reset();

    //! Get the number of items.
    int GetNbItems() const;

    /** Get the statistics information by pair.
    * \param pNum	        The index of statistics data to be got.
    * \param pItemName		Output the item's name.
    * \param pItemCount		Output the item's count. 
    * \return				\c True if successful, \c False otherwise.
    */
    bool GetItemPair(int pNum, FbxString& pItemName, int& pItemCount) const;

  	/** Assignment operator.
	  * \param pStatistics FbxStatistics assigned to this one.
	  */
    FbxStatistics& operator=(const FbxStatistics& pStatistics);

protected:
  	/** virtual function to define the process of the incoming statistics data.
	  * \param pItemName            The item's name
      * \param pItemCount           The item's count.
      * \return                     False.
	  */
    virtual bool AddItem(FbxString& /*pItemName*/, int /*pItemCount*/) { return false; };

    //! An array to store item's name.
    FbxArray<FbxString*> mItemName;

	//! An array to store item's count.
    FbxArray<int> mItemCount;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_STATISTICS_H_ */
