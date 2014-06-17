namespace Max2Babylon
{
    partial class LightPropertiesForm
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
            this.butOK = new System.Windows.Forms.Button();
            this.butCancel = new System.Windows.Forms.Button();
            this.groupBox3 = new System.Windows.Forms.GroupBox();
            this.grpAutoAnimate = new System.Windows.Forms.GroupBox();
            this.chkLoop = new System.Windows.Forms.CheckBox();
            this.nupTo = new System.Windows.Forms.NumericUpDown();
            this.label4 = new System.Windows.Forms.Label();
            this.nupFrom = new System.Windows.Forms.NumericUpDown();
            this.label5 = new System.Windows.Forms.Label();
            this.chkAutoAnimate = new System.Windows.Forms.CheckBox();
            this.groupBox4 = new System.Windows.Forms.GroupBox();
            this.chkNoExport = new System.Windows.Forms.CheckBox();
            this.groupBox3.SuspendLayout();
            this.grpAutoAnimate.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupTo)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupFrom)).BeginInit();
            this.groupBox4.SuspendLayout();
            this.SuspendLayout();
            // 
            // butOK
            // 
            this.butOK.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butOK.DialogResult = System.Windows.Forms.DialogResult.OK;
            this.butOK.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butOK.Location = new System.Drawing.Point(93, 252);
            this.butOK.Name = "butOK";
            this.butOK.Size = new System.Drawing.Size(75, 23);
            this.butOK.TabIndex = 1;
            this.butOK.Text = "OK";
            this.butOK.UseVisualStyleBackColor = true;
            this.butOK.Click += new System.EventHandler(this.butOK_Click);
            // 
            // butCancel
            // 
            this.butCancel.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.butCancel.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butCancel.Location = new System.Drawing.Point(174, 252);
            this.butCancel.Name = "butCancel";
            this.butCancel.Size = new System.Drawing.Size(75, 23);
            this.butCancel.TabIndex = 2;
            this.butCancel.Text = "Cancel";
            this.butCancel.UseVisualStyleBackColor = true;
            // 
            // groupBox3
            // 
            this.groupBox3.Controls.Add(this.grpAutoAnimate);
            this.groupBox3.Controls.Add(this.chkAutoAnimate);
            this.groupBox3.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox3.Location = new System.Drawing.Point(12, 77);
            this.groupBox3.Name = "groupBox3";
            this.groupBox3.Size = new System.Drawing.Size(319, 156);
            this.groupBox3.TabIndex = 5;
            this.groupBox3.TabStop = false;
            this.groupBox3.Text = "Animations";
            // 
            // grpAutoAnimate
            // 
            this.grpAutoAnimate.Controls.Add(this.chkLoop);
            this.grpAutoAnimate.Controls.Add(this.nupTo);
            this.grpAutoAnimate.Controls.Add(this.label4);
            this.grpAutoAnimate.Controls.Add(this.nupFrom);
            this.grpAutoAnimate.Controls.Add(this.label5);
            this.grpAutoAnimate.Enabled = false;
            this.grpAutoAnimate.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.grpAutoAnimate.Location = new System.Drawing.Point(21, 51);
            this.grpAutoAnimate.Name = "grpAutoAnimate";
            this.grpAutoAnimate.Size = new System.Drawing.Size(292, 99);
            this.grpAutoAnimate.TabIndex = 3;
            this.grpAutoAnimate.TabStop = false;
            // 
            // chkLoop
            // 
            this.chkLoop.AutoSize = true;
            this.chkLoop.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkLoop.Location = new System.Drawing.Point(9, 66);
            this.chkLoop.Name = "chkLoop";
            this.chkLoop.Size = new System.Drawing.Size(47, 17);
            this.chkLoop.TabIndex = 5;
            this.chkLoop.Text = "Loop";
            this.chkLoop.ThreeState = true;
            this.chkLoop.UseVisualStyleBackColor = true;
            // 
            // nupTo
            // 
            this.nupTo.Location = new System.Drawing.Point(47, 40);
            this.nupTo.Maximum = new decimal(new int[] {
            1000,
            0,
            0,
            0});
            this.nupTo.Name = "nupTo";
            this.nupTo.Size = new System.Drawing.Size(120, 20);
            this.nupTo.TabIndex = 3;
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Location = new System.Drawing.Point(6, 42);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(23, 13);
            this.label4.TabIndex = 4;
            this.label4.Text = "To:";
            // 
            // nupFrom
            // 
            this.nupFrom.Location = new System.Drawing.Point(47, 14);
            this.nupFrom.Maximum = new decimal(new int[] {
            1000,
            0,
            0,
            0});
            this.nupFrom.Name = "nupFrom";
            this.nupFrom.Size = new System.Drawing.Size(120, 20);
            this.nupFrom.TabIndex = 1;
            // 
            // label5
            // 
            this.label5.AutoSize = true;
            this.label5.Location = new System.Drawing.Point(6, 16);
            this.label5.Name = "label5";
            this.label5.Size = new System.Drawing.Size(33, 13);
            this.label5.TabIndex = 2;
            this.label5.Text = "From:";
            // 
            // chkAutoAnimate
            // 
            this.chkAutoAnimate.AutoSize = true;
            this.chkAutoAnimate.Location = new System.Drawing.Point(21, 28);
            this.chkAutoAnimate.Name = "chkAutoAnimate";
            this.chkAutoAnimate.Size = new System.Drawing.Size(88, 17);
            this.chkAutoAnimate.TabIndex = 0;
            this.chkAutoAnimate.Text = "Auto animate";
            this.chkAutoAnimate.ThreeState = true;
            this.chkAutoAnimate.UseVisualStyleBackColor = true;
            this.chkAutoAnimate.CheckedChanged += new System.EventHandler(this.chkAutoAnimate_CheckedChanged);
            // 
            // groupBox4
            // 
            this.groupBox4.Controls.Add(this.chkNoExport);
            this.groupBox4.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox4.Location = new System.Drawing.Point(12, 12);
            this.groupBox4.Name = "groupBox4";
            this.groupBox4.Size = new System.Drawing.Size(319, 59);
            this.groupBox4.TabIndex = 7;
            this.groupBox4.TabStop = false;
            this.groupBox4.Text = "Misc.";
            // 
            // chkNoExport
            // 
            this.chkNoExport.AutoSize = true;
            this.chkNoExport.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkNoExport.Location = new System.Drawing.Point(21, 28);
            this.chkNoExport.Name = "chkNoExport";
            this.chkNoExport.Size = new System.Drawing.Size(87, 17);
            this.chkNoExport.TabIndex = 4;
            this.chkNoExport.Text = "Do not export";
            this.chkNoExport.ThreeState = true;
            this.chkNoExport.UseVisualStyleBackColor = true;
            // 
            // LightPropertiesForm
            // 
            this.AcceptButton = this.butOK;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.butCancel;
            this.ClientSize = new System.Drawing.Size(343, 287);
            this.Controls.Add(this.groupBox4);
            this.Controls.Add(this.groupBox3);
            this.Controls.Add(this.butCancel);
            this.Controls.Add(this.butOK);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
            this.Name = "LightPropertiesForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Babylon.js - Light Properties";
            this.Load += new System.EventHandler(this.LightPropertiesForm_Load);
            this.groupBox3.ResumeLayout(false);
            this.groupBox3.PerformLayout();
            this.grpAutoAnimate.ResumeLayout(false);
            this.grpAutoAnimate.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupTo)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupFrom)).EndInit();
            this.groupBox4.ResumeLayout(false);
            this.groupBox4.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button butOK;
        private System.Windows.Forms.Button butCancel;
        private System.Windows.Forms.GroupBox groupBox3;
        private System.Windows.Forms.GroupBox grpAutoAnimate;
        private System.Windows.Forms.CheckBox chkLoop;
        private System.Windows.Forms.NumericUpDown nupTo;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.NumericUpDown nupFrom;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.CheckBox chkAutoAnimate;
        private System.Windows.Forms.GroupBox groupBox4;
        private System.Windows.Forms.CheckBox chkNoExport;
    }
}