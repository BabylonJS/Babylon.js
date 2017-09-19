unit MainFrm;

interface

uses
  Windows, Messages, SysUtils, Variants, Classes, Graphics, Controls, Forms,
  Dialogs, Menus, ExtCtrls, Math, GR32, GR32_Image, GR32_Transforms,
  ExtDlgs;

type
  TMainForm = class(TForm)
    PopupMenu: TPopupMenu;
    ZoomInItem: TMenuItem;
    ZoomOutItem: TMenuItem;
    ActualSizeItem: TMenuItem;
    ImgView32: TImgView32;
    N1: TMenuItem;
    AlphaView: TImgView32;
    ShowAlphaItem: TMenuItem;
    RotateClockwiseItem: TMenuItem;
    RotateAntiClockwiseItem: TMenuItem;
    N3: TMenuItem;
    ShowWithAlphaItem: TMenuItem;
    N4: TMenuItem;
    FlipHorizontalItem: TMenuItem;
    FilpVerticalItem: TMenuItem;
    FilterTimer: TTimer;
    OpenImageItem: TMenuItem;
    N2: TMenuItem;
    OpenDialog: TOpenDialog;
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
    procedure FormShow(Sender: TObject);
    procedure ZoomInItemClick(Sender: TObject);
    procedure ZoomOutItemClick(Sender: TObject);
    procedure ActualSizeItemClick(Sender: TObject);
    procedure ScrollBoxMouseWheel(Sender: TObject; Shift: TShiftState;
      WheelDelta: Integer; MousePos: TPoint; var Handled: Boolean);
    procedure FormKeyUp(Sender: TObject; var Key: Word;
      Shift: TShiftState);
    procedure ShowAlphaItemClick(Sender: TObject);
    procedure RotateClockwiseItemClick(Sender: TObject);
    procedure RotateAntiClockwiseItemClick(Sender: TObject);
    procedure ShowWithAlphaItemClick(Sender: TObject);
    procedure FlipHorizontalItemClick(Sender: TObject);
    procedure FilpVerticalItemClick(Sender: TObject);
    procedure FilterTimerTimer(Sender: TObject);
    procedure ImgView32Scroll(Sender: TObject);
    procedure OpenImageItemClick(Sender: TObject);
  private
    { Private declarations }
    OrigWidth : integer;
    OrigHeight : integer;
    BPP : longword;

    procedure LoadImage( Name : string);
    procedure RecalcWindowSize;
  public
    { Public declarations }
  end;

var
  MainForm: TMainForm;

implementation

{$R *.dfm}

uses FreeImage, GR32_Resamplers;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
procedure TMainForm.FormCreate(Sender: TObject);
begin
  AlphaView.Visible := False;
  AlphaView.Align := alClient;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.FormDestroy(Sender: TObject);
begin
  // ...
end;
// -----------------------------------------------------------------------------
procedure TMainForm.FormShow(Sender: TObject);
var
  Resampler: TKernelResampler;
begin
  Resampler := TKernelResampler.Create(ImgView32.Bitmap);
  Resampler.Kernel := TSplineKernel.Create;
  if ParamCount = 1 then
    LoadImage(ParamStr(1));
end;
// -----------------------------------------------------------------------------
procedure TMainForm.LoadImage( Name : string);
var
  dib : PFIBITMAP;
  PBH : PBITMAPINFOHEADER;
  PBI : PBITMAPINFO;
  t : FREE_IMAGE_FORMAT;
  Ext : string;
  BM : TBitmap;
  x, y : integer;
  BP : PLONGWORD;
  DC : HDC;
begin
  try
    t := FreeImage_GetFileType(PAnsiChar(AnsiString(Name)), 16);

    if t = FIF_UNKNOWN then
    begin
      // Check for types not supported by GetFileType
      Ext := UpperCase(ExtractFileExt(Name));
      if (Ext = '.TGA') or(Ext = '.TARGA') then
        t := FIF_TARGA
      else if Ext = '.MNG' then
        t := FIF_MNG
      else if Ext = '.PCD' then
        t := FIF_PCD
      else if Ext = '.WBMP' then
        t := FIF_WBMP
      else if Ext = '.CUT' then
        t := FIF_CUT
      else
        raise Exception.Create('The file "' + Name + '" cannot be displayed because SFM does not recognise the file type.');
    end;

    dib := FreeImage_Load(t, PAnsiChar(AnsiString(name)), 0);
    if Dib = nil then
      Close;
    PBH := FreeImage_GetInfoHeader(dib);
    PBI := FreeImage_GetInfo(dib);

    BPP := FreeImage_GetBPP(dib);

    ShowWithAlphaItem.Enabled := BPP = 32;
    ShowAlphaItem.Enabled := BPP = 32;

    if BPP = 32 then
    begin
      ImgView32.Bitmap.SetSize(FreeImage_GetWidth(dib), FreeImage_GetHeight(dib));

      BP := PLONGWORD(FreeImage_GetBits(dib));
      for y := ImgView32.Bitmap.Height - 1 downto 0 do
        for x := 0 to ImgView32.Bitmap.Width - 1 do
        begin
          ImgView32.Bitmap.Pixel[x, y] := BP^;
          inc(BP);
        end;
    end
    else
    begin
      BM := TBitmap.Create;

      BM.Assign(nil);
      DC := GetDC(Handle);

      BM.handle := CreateDIBitmap(DC,
        PBH^,
        CBM_INIT,
        PChar(FreeImage_GetBits(dib)),
        PBI^,
        DIB_RGB_COLORS);

      ImgView32.Bitmap.Assign(BM);
      AlphaView.Bitmap.Assign(BM);

      BM.Free;
      ReleaseDC(Handle, DC);
    end;
    FreeImage_Unload(dib);

    OrigWidth := ImgView32.Bitmap.Width;
    OrigHeight := ImgView32.Bitmap.Height;

    Caption := ExtractFileName( Name ) + '   (' + IntToStr(OrigWidth) +
                  ' x ' + IntToStr(OrigHeight) + ')';
    if BPP = 32 then
      Caption := Caption + ' + Alpha';                  

    AlphaView.Bitmap.SetSize(OrigWidth, OrigWidth);

    ImgView32.Hint := 'Name: ' + Name + #13 +
                      'Width: ' + IntToStr(OrigWidth) + #13 +
                      'Height: ' + IntToStr(OrigHeight) + #13 +
                      'BPP: ' + IntToStr(BPP);

    RecalcWindowSize;

    Show;
  except
    on e:exception do
    begin
      Application.BringToFront;
      MessageDlg(e.message, mtInformation, [mbOK], 0);
      Close;
    end;
  end;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ZoomInItemClick(Sender: TObject);
begin
  FilterTimer.Enabled := False;
  if not (ImgView32.Bitmap.Resampler is TNearestResampler) then
    TNearestResampler.Create(ImgView32.Bitmap);
  FilterTimer.Enabled := True;

  ImgView32.Scale := ImgView32.Scale * 2.0;
  RecalcWindowSize;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ZoomOutItemClick(Sender: TObject);
begin
  FilterTimer.Enabled := False;
  if not (ImgView32.Bitmap.Resampler is TNearestResampler) then
    TNearestResampler.Create(ImgView32.Bitmap);
  FilterTimer.Enabled := True;

  ImgView32.Scale := ImgView32.Scale / 2.0;
  RecalcWindowSize;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ActualSizeItemClick(Sender: TObject);
begin
  FilterTimer.Enabled := False;
  if not (ImgView32.Bitmap.Resampler is TNearestResampler) then
    TNearestResampler.Create(ImgView32.Bitmap);
  FilterTimer.Enabled := True;

  ImgView32.Scale := 1.0;

  RecalcWindowSize;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.RecalcWindowSize;
var
  Rect : TRect;
  CW, CH : integer;
  WSH, WSW : integer;
  TitleH : integer;
  BorderY : integer;
  BorderX : integer;
begin
  CW := ImgView32.Bitmap.Width + GetSystemMetrics(SM_CXVSCROLL);
  CH := ImgView32.Bitmap.Height + GetSystemMetrics(SM_CYVSCROLL);

  SystemParametersInfo( SPI_GETWORKAREA, 0, @Rect, 0);

  WSH := Rect.Bottom - Rect.Top;
  WSW := Rect.Right - Rect.Left;
  TitleH := GetSystemMetrics(SM_CYCAPTION);
  BorderY := GetSystemMetrics(SM_CYSIZEFRAME) * 2;
  BorderX := GetSystemMetrics(SM_CXSIZEFRAME) * 2;

  if (Top + CH + TitleH + BorderY > WSH) or (CH + TitleH + BorderY > WSH) then
  begin
    Top := Rect.Bottom - CH - BorderY;
    if Top < 0 then
    begin
      Top := 0;
      CH := WSH - TitleH - BorderY;
      CW := CW + GetSystemMetrics(SM_CXVSCROLL);

      if CW + BorderX > WSW then
        CH := CH - GetSystemMetrics(SM_CYVSCROLL);
    end;
  end;

  if (Left + CW + BorderX > WSW) or (CW + BorderX > WSW) then
  begin
    Left := Rect.Right - CW - BorderX;
    if Left < 0 then
    begin
      Left := 0;
      CW := WSW - BorderX;
      CH := CH + GetSystemMetrics(SM_CYVSCROLL);

      if CH + TitleH + BorderY > WSH then
        CW := CW + GetSystemMetrics(SM_CXVSCROLL);
    end
  end;

  ClientWidth := CW;
  ClientHeight := CH;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ScrollBoxMouseWheel(Sender: TObject;
  Shift: TShiftState; WheelDelta: Integer; MousePos: TPoint;
  var Handled: Boolean);
begin
  FilterTimer.Enabled := False;
  if not (ImgView32.Bitmap.Resampler is TNearestResampler) then
    TNearestResampler.Create(ImgView32.Bitmap);
  FilterTimer.Enabled := True;

  if WheelDelta < 0 then
    ImgView32.Scroll(0, 20)
  else
    ImgView32.Scroll(0, -20);
  Handled := True;    
end;
// -----------------------------------------------------------------------------
procedure TMainForm.FormKeyUp(Sender: TObject; var Key: Word;
  Shift: TShiftState);
var
  Amount : integer;
begin
  FilterTimer.Enabled := False;
  if not (ImgView32.Bitmap.Resampler is TNearestResampler) then
    TNearestResampler.Create(ImgView32.Bitmap);
  FilterTimer.Enabled := True;

  if ssShift in Shift then
    Amount := 20 * 2
  else
    Amount := 20;

  case Key of
    VK_ESCAPE:
      Close;
    VK_UP:
      ImgView32.Scroll(0, -Amount);
    VK_DOWN:
      ImgView32.Scroll(0, Amount);
    VK_LEFT:
      ImgView32.Scroll(-Amount, 0);
    VK_RIGHT:
      ImgView32.Scroll(Amount, 0);
    VK_HOME:
      ImgView32.ScrollToCenter(0, 0);
    VK_END:
      ImgView32.ScrollToCenter(ImgView32.Bitmap.Width, ImgView32.Bitmap.Height);
    VK_NEXT:
      ImgView32.Scroll(0, (Trunc(ImgView32.Bitmap.Height div 4)));
    VK_PRIOR:
      ImgView32.Scroll(0, -(Trunc(ImgView32.Bitmap.Height div 4)));
  end;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ShowAlphaItemClick(Sender: TObject);
var
  x, y : integer;
  Col : TColor32;
  Alpha : TColor;
begin
  if ShowAlphaItem.Checked then
  begin
    AlphaView.Visible := False;
    AlphaView.Bitmap.Delete;
  end
  else
  begin
    AlphaView.Bitmap.Width := ImgView32.Bitmap.Width;
    AlphaView.Bitmap.Height := ImgView32.Bitmap.Height;

    for x := 0 to AlphaView.Bitmap.Width - 1 do
      for y := 0 to AlphaView.Bitmap.Height - 1 do
      begin
        Col := ImgView32.Bitmap.Pixel[x, y];
        Alpha := Col shr 24;
        AlphaView.Bitmap.Pixel[x, y] := Alpha + (Alpha shl 8) + (Alpha shl 16);
      end;
    AlphaView.Visible := True;
  end;
  ShowAlphaItem.Checked := not ShowAlphaItem.Checked;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.RotateClockwiseItemClick(Sender: TObject);
var
  x : integer;
  y : integer;
  DestX : integer;
  DestY : integer;
  C : TColor32;
begin
  AlphaView.Bitmap.Assign(ImgView32.Bitmap);

  ImgView32.BeginUpdate;
  ImgView32.Bitmap.Width := AlphaView.Bitmap.Height;
  ImgView32.Bitmap.Height := AlphaView.Bitmap.Width;

  for x := 0 to AlphaView.Bitmap.Width - 1 do
    for y := 0 to AlphaView.Bitmap.Height - 1 do
    begin
      C := AlphaView.Bitmap.Pixel[x, y];

      DestX := (ImgView32.Bitmap.Width - 1) - Y;
      DestY := X;

      ImgView32.Bitmap.Pixels[DestX, DestY] := C;
    end;

  ImgView32.EndUpdate;
  ImgView32.Refresh;
end;

// -----------------------------------------------------------------------------
procedure TMainForm.RotateAntiClockwiseItemClick(Sender: TObject);
var
  x : integer;
  y : integer;
  DestX : integer;
  DestY : integer;
  C : TColor32;
begin
  AlphaView.Bitmap.Assign(ImgView32.Bitmap);

  ImgView32.BeginUpdate;
  ImgView32.Bitmap.Width := AlphaView.Bitmap.Height;
  ImgView32.Bitmap.Height := AlphaView.Bitmap.Width;

  for x := 0 to AlphaView.Bitmap.Width - 1 do
    for y := 0 to AlphaView.Bitmap.Height - 1 do
    begin
      C := AlphaView.Bitmap.Pixel[x, y];

      DestX := Y;
      DestY := (ImgView32.Bitmap.Height - 1) -X;

      ImgView32.Bitmap.Pixels[DestX, DestY] := C;
    end;

  ImgView32.EndUpdate;
  ImgView32.Refresh;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ShowWithAlphaItemClick(Sender: TObject);
begin
  if ShowWithAlphaItem.Checked then
    ImgView32.Bitmap.DrawMode := dmOpaque
  else
    ImgView32.Bitmap.DrawMode := dmBlend;
  ShowWithAlphaItem.Checked := not ShowWithAlphaItem.Checked;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.FlipHorizontalItemClick(Sender: TObject);
var
  x : integer;
  y : integer;
  DestX : integer;
  DestY : integer;
  C : TColor32;
begin
  AlphaView.Bitmap.Assign(ImgView32.Bitmap);

  ImgView32.BeginUpdate;
  ImgView32.Bitmap.Width := AlphaView.Bitmap.Width;
  ImgView32.Bitmap.Height := AlphaView.Bitmap.Height;

  for x := 0 to AlphaView.Bitmap.Width - 1 do
    for y := 0 to AlphaView.Bitmap.Height - 1 do
    begin
      C := AlphaView.Bitmap.Pixel[x, y];

      DestX := (ImgView32.Bitmap.Width - 1) -X;
      DestY := Y;

      ImgView32.Bitmap.Pixels[DestX, DestY] := C;
    end;

  ImgView32.EndUpdate;
  ImgView32.Refresh;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.FilpVerticalItemClick(Sender: TObject);
var
  x : integer;
  y : integer;
  DestX : integer;
  DestY : integer;
  C : TColor32;
begin
  AlphaView.Bitmap.Assign(ImgView32.Bitmap);

  ImgView32.BeginUpdate;
  ImgView32.Bitmap.Width := AlphaView.Bitmap.Width;
  ImgView32.Bitmap.Height := AlphaView.Bitmap.Height;

  for x := 0 to AlphaView.Bitmap.Width - 1 do
    for y := 0 to AlphaView.Bitmap.Height - 1 do
    begin
      C := AlphaView.Bitmap.Pixel[x, y];

      DestX := X;
      DestY := (ImgView32.Bitmap.Height - 1) - Y;

      ImgView32.Bitmap.Pixels[DestX, DestY] := C;
    end;

  ImgView32.EndUpdate;
  ImgView32.Refresh;
end;

// -----------------------------------------------------------------------------
procedure TMainForm.FilterTimerTimer(Sender: TObject);
var
  Resampler: TKernelResampler;
begin
  FilterTimer.Enabled := False;
  Resampler := TKernelResampler.Create(ImgView32.Bitmap);
  Resampler.Kernel := TSplineKernel.Create;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.ImgView32Scroll(Sender: TObject);
begin
  FilterTimer.Enabled := False;
  if not (ImgView32.Bitmap.Resampler is TNearestResampler) then
    TNearestResampler.Create(ImgView32.Bitmap);
  FilterTimer.Enabled := True;
end;
// -----------------------------------------------------------------------------
procedure TMainForm.OpenImageItemClick(Sender: TObject);
begin
  if OpenDialog.Execute then
    begin
      try
        Screen.Cursor := crHourGlass;
        LoadImage(OpenDialog.FileName);
      finally
        Screen.Cursor := crDefault;
      end;
    end;
end;

end.
