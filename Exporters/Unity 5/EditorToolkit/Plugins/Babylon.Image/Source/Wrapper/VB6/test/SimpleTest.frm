VERSION 5.00
Begin VB.Form SimpleTest 
   Caption         =   "SimpleTest"
   ClientHeight    =   1035
   ClientLeft      =   60
   ClientTop       =   345
   ClientWidth     =   2325
   LinkTopic       =   "Form1"
   ScaleHeight     =   1035
   ScaleWidth      =   2325
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton btnTest 
      Caption         =   "Test"
      Height          =   495
      Left            =   240
      TabIndex        =   0
      Top             =   240
      Width           =   1575
   End
End
Attribute VB_Name = "SimpleTest"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Option Explicit
' NOTE :
' To run this test program, you will have to copy the FreeImage.dll file
' in this directory.
' Change also the "test.tif" file name with a path to any tif file on your
' hard disk
'
Private Sub btnTest_Click()
  Dim dib As Long
  Dim bOK As Long
  ' Load a tif image
  dib = FreeImage_Load(FIF_TIFF, "test.tif", 0)
  
  ' Save this image as PNG
  bOK = FreeImage_Save(FIF_PNG, dib, "test.png", 0)
  
  ' Unload the dib
  FreeImage_Unload (dib)

End Sub
