object MainForm: TMainForm
  Left = 304
  Top = 165
  Width = 467
  Height = 405
  Caption = 'Image Preview'
  Color = clWhite
  Font.Charset = DEFAULT_CHARSET
  Font.Color = clWindowText
  Font.Height = -11
  Font.Name = 'MS Sans Serif'
  Font.Style = []
  KeyPreview = True
  OldCreateOrder = False
  Position = poDesktopCenter
  OnCreate = FormCreate
  OnDestroy = FormDestroy
  OnKeyUp = FormKeyUp
  OnMouseWheel = ScrollBoxMouseWheel
  OnShow = FormShow
  PixelsPerInch = 96
  TextHeight = 13
  object ImgView32: TImgView32
    Left = 0
    Top = 0
    Width = 459
    Height = 371
    Align = alClient
    ParentShowHint = False
    PopupMenu = PopupMenu
    Scale = 1
    ScrollBars.Color = clScrollBar
    ScrollBars.ShowHandleGrip = True
    ScrollBars.Style = rbsDefault
    ShowHint = True
    SizeGrip = sgAuto
    TabOrder = 0
    OnScroll = ImgView32Scroll
    object AlphaView: TImgView32
      Left = 8
      Top = 8
      Width = 161
      Height = 145
      Scale = 1
      ScrollBars.Color = clScrollBar
      ScrollBars.ShowHandleGrip = True
      ScrollBars.Style = rbsDefault
      SizeGrip = sgAuto
      TabOrder = 2
      Visible = False
    end
  end
  object PopupMenu: TPopupMenu
    Left = 304
    Top = 28
    object ZoomInItem: TMenuItem
      Caption = 'Zoom In'
      OnClick = ZoomInItemClick
    end
    object ZoomOutItem: TMenuItem
      Caption = 'Zoom Out'
      OnClick = ZoomOutItemClick
    end
    object ActualSizeItem: TMenuItem
      Caption = 'Actual Size'
      OnClick = ActualSizeItemClick
    end
    object N1: TMenuItem
      Caption = '-'
    end
    object RotateClockwiseItem: TMenuItem
      Caption = 'Rotate Clockwise'
      OnClick = RotateClockwiseItemClick
    end
    object RotateAntiClockwiseItem: TMenuItem
      Caption = 'Rotate Anti-Clockwise'
      OnClick = RotateAntiClockwiseItemClick
    end
    object N4: TMenuItem
      Caption = '-'
    end
    object FlipHorizontalItem: TMenuItem
      Caption = 'Flip Horizontal'
      OnClick = FlipHorizontalItemClick
    end
    object FilpVerticalItem: TMenuItem
      Caption = 'Filp Vertical'
      OnClick = FilpVerticalItemClick
    end
    object N3: TMenuItem
      Caption = '-'
    end
    object ShowAlphaItem: TMenuItem
      Caption = 'Show Just Alpha Channel'
      OnClick = ShowAlphaItemClick
    end
    object ShowWithAlphaItem: TMenuItem
      Caption = 'Show With Alpha Channel'
      OnClick = ShowWithAlphaItemClick
    end
    object N2: TMenuItem
      Caption = '-'
    end
    object OpenImageItem: TMenuItem
      Caption = 'Open New Image'
      OnClick = OpenImageItemClick
    end
  end
  object FilterTimer: TTimer
    Interval = 500
    OnTimer = FilterTimerTimer
    Left = 308
    Top = 84
  end
  object OpenDialog: TOpenDialog
    Filter = 
      'All image files|*.bmp;*.cut;*.ico;*.iff;*.lbm;*.jng;*.jpg;*.jpeg' +
      ';*.koa;*.mng;*.pbm;*.pcd;*.pcx;*.pgm;*.png;*.ppm;*.psd;*.ras;*.t' +
      'ga;*.tif;*.tiff;.wbmp;*.xbm;*.xpm)|Windows or OS/2 Bitmap File (' +
      '*.BMP)|*.BMP|Dr. Halo (*.CUT)|*.CUT|Windows Icon (*.ICO)|*.ICO|A' +
      'miga IFF (*.IFF, *.LBM)|*.IFF;*.LBM|JPEG Network Graphics (*.JNG' +
      ')|*.JNG|Independent JPEG Group (*.JPG)|*.JPG|Commodore 64 Koala ' +
      '(*.KOA)|*.KOA|Multiple Network Graphics (*.MNG)|*.MNG|Portable B' +
      'itmap (*.PBM)|*.PBM|Kodak PhotoCD (*.PCD)|*.PCD|PCX bitmap forma' +
      't (*.PCX)|*.PCX|Portable Graymap (*.PGM)|*.PGM|Portable Network ' +
      'Graphics (*.PNG)|*.PNG|Portable Pixelmap (*.PPM)|*.PPM|Photoshop' +
      ' (*.PSD)|*.PSD|Sun Rasterfile (*.RAS)|*.RAS|Targa files (*.TGA)|' +
      '*.TGA|Tagged Image File Format (*.TIF)|*.TIF;*.TIFF|Wireless Bit' +
      'map (*.WBMP)|*.WBMP|X11 Bitmap Format (*.XBM)|*.XBM|X11 Pixmap F' +
      'ormat (*.XPM)|*.XPM'
    Title = 'Open Image File'
    Left = 328
    Top = 228
  end
end
