unit mbMainForm;

interface

uses
  Windows, Messages, SysUtils, Variants, Classes, Graphics, Controls, Forms,
  Dialogs, ComCtrls, ToolWin, StdCtrls, FreeBitmap;

type
  TMainForm = class(TForm)
    ToolBar: TToolBar;
    tbLoad: TToolButton;
    ToolButton1: TToolButton;
    tbClose: TToolButton;
    ToolButton2: TToolButton;
    cbPages: TComboBox;
    Label1: TLabel;
    OD: TOpenDialog;
    procedure tbLoadClick(Sender: TObject);
    procedure FormPaint(Sender: TObject);
    procedure tbCloseClick(Sender: TObject);
    procedure cbPagesChange(Sender: TObject);
    procedure FormResize(Sender: TObject);
  private
    FMultiBitmap: TFreeMultiBitmap;
    FPage: TFreeWinBitmap;

    procedure PageBitmapChangeHandler(Sender: TObject);
    procedure WMEraseBkgnd(var Message: TWMEraseBkgnd); message WM_ERASEBKGND;
  public
    constructor Create(AOwner: TComponent); override;
    destructor Destroy; override;

    procedure OpenMultiBitmap(const FileName: string);
    procedure CloseMultiBitmap;
    procedure OpenPage(Number: Integer);
  end;

var
  MainForm: TMainForm;

implementation

{$R *.dfm}

{ TMainForm }

procedure TMainForm.CloseMultiBitmap;
begin
  if FPage.IsValid then
    FMultiBitmap.UnlockPage(Fpage, False);
  FMultiBitmap.Close;
  cbPages.Clear;
end;

constructor TMainForm.Create(AOwner: TComponent);
begin
  inherited;
  FMultiBitmap := TFreeMultiBitmap.Create;
  FPage := TFreeWinBitmap.Create;
  FPage.OnChange := PageBitmapChangeHandler;
end;

destructor TMainForm.Destroy;
begin
  if FMultiBitmap.IsValid then
    CloseMultiBitmap;
  FMultiBitmap.Free;
  inherited;
end;

procedure TMainForm.OpenMultiBitmap(const FileName: string);
var
  I, Cnt: Integer;
begin
  if FMultiBitmap.IsValid then CloseMultiBitmap;

  FMultiBitmap.Open(FileName, False, True);

  Cnt := FMultiBitmap.GetPageCount;
  cbPages.OnChange := nil;
  cbPages.Clear;
  for I := 0 to Cnt - 1 do
    cbPages.Items.Add(IntToStr(I));
  cbPages.OnChange := cbPagesChange;
end;

procedure TMainForm.OpenPage(Number: Integer);
begin
  if not FMultiBitmap.IsValid then Exit;

  if FPage.IsValid then
    FMultiBitmap.UnlockPage(FPage, False);

  FMultiBitmap.LockPage(Number, FPage);
end;

procedure TMainForm.PageBitmapChangeHandler(Sender: TObject);
begin
  Invalidate;
end;

procedure TMainForm.tbLoadClick(Sender: TObject);
begin
  if OD.Execute then
  begin
    try
      OpenMultiBitmap(OD.FileName);
    except
      raise Exception.CreateFmt('Can not load file %s', [OD.FileName]);
    end;
  end;
end;

procedure TMainForm.WMEraseBkgnd(var Message: TWMEraseBkgnd);
begin
  Message.Result := 1;
end;

procedure TMainForm.FormPaint(Sender: TObject);
begin
  if not FPage.IsValid then
  begin
    Canvas.Brush.Color := clBtnFace;
    Canvas.FillRect(ClientRect);
  end
  else
    FPage.Draw(Canvas.Handle, ClientRect);
end;

procedure TMainForm.tbCloseClick(Sender: TObject);
begin
  if FMultiBitmap.IsValid then
    CloseMultiBitmap;
end;

procedure TMainForm.cbPagesChange(Sender: TObject);
var
  Page: Integer;
begin
  Page := StrToInt(cbPages.Text);
  OpenPage(Page);
end;

procedure TMainForm.FormResize(Sender: TObject);
begin
  Invalidate;
end;

end.
