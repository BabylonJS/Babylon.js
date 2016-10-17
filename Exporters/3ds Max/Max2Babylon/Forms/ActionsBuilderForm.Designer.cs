namespace Max2Babylon
{
    partial class ActionsBuilderForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.ActionsBuilderWebView = new System.Windows.Forms.WebBrowser();
            this.butCancel = new System.Windows.Forms.Button();
            this.butOK = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // ActionsBuilderWebView
            // 
            this.ActionsBuilderWebView.AccessibleRole = System.Windows.Forms.AccessibleRole.Window;
            this.ActionsBuilderWebView.AllowNavigation = false;
            this.ActionsBuilderWebView.Anchor = ((System.Windows.Forms.AnchorStyles)((((System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom) 
            | System.Windows.Forms.AnchorStyles.Left) 
            | System.Windows.Forms.AnchorStyles.Right)));
            this.ActionsBuilderWebView.IsWebBrowserContextMenuEnabled = false;
            this.ActionsBuilderWebView.Location = new System.Drawing.Point(0, 0);
            this.ActionsBuilderWebView.MinimumSize = new System.Drawing.Size(20, 20);
            this.ActionsBuilderWebView.Name = "ActionsBuilderWebView";
            this.ActionsBuilderWebView.Size = new System.Drawing.Size(723, 537);
            this.ActionsBuilderWebView.TabIndex = 0;
            this.ActionsBuilderWebView.DocumentCompleted += new System.Windows.Forms.WebBrowserDocumentCompletedEventHandler(this.ActionsBuilderWebView_DocumentCompleted);
            // 
            // butCancel
            // 
            this.butCancel.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.butCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.butCancel.Location = new System.Drawing.Point(636, 544);
            this.butCancel.Name = "butCancel";
            this.butCancel.Size = new System.Drawing.Size(75, 23);
            this.butCancel.TabIndex = 1;
            this.butCancel.Text = "Cancel";
            this.butCancel.UseVisualStyleBackColor = true;
            this.butCancel.Click += new System.EventHandler(this.butCancel_Click);
            // 
            // butOK
            // 
            this.butOK.Anchor = ((System.Windows.Forms.AnchorStyles)((System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right)));
            this.butOK.DialogResult = System.Windows.Forms.DialogResult.OK;
            this.butOK.Location = new System.Drawing.Point(555, 544);
            this.butOK.Name = "butOK";
            this.butOK.Size = new System.Drawing.Size(75, 23);
            this.butOK.TabIndex = 2;
            this.butOK.Text = "OK";
            this.butOK.UseVisualStyleBackColor = true;
            this.butOK.Click += new System.EventHandler(this.butOK_Click);
            // 
            // ActionsBuilderForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(723, 579);
            this.Controls.Add(this.butOK);
            this.Controls.Add(this.butCancel);
            this.Controls.Add(this.ActionsBuilderWebView);
            this.Name = "ActionsBuilderForm";
            this.Text = "Babylon.js Actions Builder";
            this.Activated += new System.EventHandler(this.ActionsBuilderForm_Activated);
            this.Deactivate += new System.EventHandler(this.ActionsBuilderForm_Deactivate);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.ActionsBuilderForm_FormClosed);
            this.Load += new System.EventHandler(this.ActionsBuilderForm_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.WebBrowser ActionsBuilderWebView;
        private System.Windows.Forms.Button butCancel;
        private System.Windows.Forms.Button butOK;
    }
}