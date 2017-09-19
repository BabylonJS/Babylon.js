object MainForm: TMainForm
  Left = 203
  Top = 192
  Width = 696
  Height = 480
  Caption = 'MultiBitmap Demo'
  Color = clBtnFace
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Shell Dlg 2'
  Font.Style = []
  OldCreateOrder = False
  OnPaint = FormPaint
  OnResize = FormResize
  PixelsPerInch = 96
  TextHeight = 13
  object ToolBar: TToolBar
    Left = 0
    Top = 0
    Width = 688
    Height = 25
    AutoSize = True
    ButtonHeight = 21
    ButtonWidth = 33
    Caption = 'ToolBar'
    EdgeBorders = [ebLeft, ebTop, ebRight, ebBottom]
    Flat = True
    Indent = 3
    ShowCaptions = True
    TabOrder = 0
    object tbLoad: TToolButton
      Left = 3
      Top = 0
      Caption = 'Load'
      ImageIndex = 0
      OnClick = tbLoadClick
    end
    object ToolButton1: TToolButton
      Left = 36
      Top = 0
      Width = 8
      Caption = 'ToolButton1'
      ImageIndex = 1
      Style = tbsSeparator
    end
    object tbClose: TToolButton
      Left = 44
      Top = 0
      Caption = 'Close'
      ImageIndex = 1
      OnClick = tbCloseClick
    end
    object ToolButton2: TToolButton
      Left = 77
      Top = 0
      Width = 8
      Caption = 'ToolButton2'
      ImageIndex = 2
      Style = tbsSeparator
    end
    object Label1: TLabel
      Left = 85
      Top = 0
      Width = 36
      Height = 21
      Caption = 'Pages: '
      Layout = tlCenter
    end
    object cbPages: TComboBox
      Left = 121
      Top = 0
      Width = 60
      Height = 21
      Style = csDropDownList
      DropDownCount = 15
      ItemHeight = 13
      TabOrder = 0
      OnChange = cbPagesChange
    end
  end
  object OD: TOpenDialog
    Filter = 'TIFF multibitmap (*.tiff, *.tif)|*.tiff; *.tif|ICO|*.ico'
    Options = [ofHideReadOnly, ofPathMustExist, ofFileMustExist, ofEnableSizing]
    Title = 'Open multibitmap..'
    Left = 64
    Top = 96
  end
end
