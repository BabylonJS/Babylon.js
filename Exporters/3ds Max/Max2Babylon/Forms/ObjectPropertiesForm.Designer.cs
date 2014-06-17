namespace Max2Babylon
{
    partial class ObjectPropertiesForm
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
            this.groupBox1 = new System.Windows.Forms.GroupBox();
            this.chkCollisions = new System.Windows.Forms.CheckBox();
            this.butCancel = new System.Windows.Forms.Button();
            this.butOK = new System.Windows.Forms.Button();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.chkNoExport = new System.Windows.Forms.CheckBox();
            this.chkShowSubMeshesBoundingBox = new System.Windows.Forms.CheckBox();
            this.chkShowBoundingBox = new System.Windows.Forms.CheckBox();
            this.chkOptimize = new System.Windows.Forms.CheckBox();
            this.chkPickable = new System.Windows.Forms.CheckBox();
            this.groupBox3 = new System.Windows.Forms.GroupBox();
            this.grpAutoAnimate = new System.Windows.Forms.GroupBox();
            this.chkLoop = new System.Windows.Forms.CheckBox();
            this.nupTo = new System.Windows.Forms.NumericUpDown();
            this.label2 = new System.Windows.Forms.Label();
            this.nupFrom = new System.Windows.Forms.NumericUpDown();
            this.label1 = new System.Windows.Forms.Label();
            this.chkAutoAnimate = new System.Windows.Forms.CheckBox();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            this.groupBox3.SuspendLayout();
            this.grpAutoAnimate.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupTo)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupFrom)).BeginInit();
            this.SuspendLayout();
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.chkCollisions);
            this.groupBox1.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox1.Location = new System.Drawing.Point(12, 12);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(319, 59);
            this.groupBox1.TabIndex = 1;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Collisions";
            // 
            // chkCollisions
            // 
            this.chkCollisions.AutoSize = true;
            this.chkCollisions.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkCollisions.Location = new System.Drawing.Point(21, 28);
            this.chkCollisions.Name = "chkCollisions";
            this.chkCollisions.Size = new System.Drawing.Size(99, 17);
            this.chkCollisions.TabIndex = 0;
            this.chkCollisions.Text = "Check collisions";
            this.chkCollisions.ThreeState = true;
            this.chkCollisions.UseVisualStyleBackColor = true;
            // 
            // butCancel
            // 
            this.butCancel.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butCancel.DialogResult = System.Windows.Forms.DialogResult.Cancel;
            this.butCancel.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butCancel.Location = new System.Drawing.Point(174, 419);
            this.butCancel.Name = "butCancel";
            this.butCancel.Size = new System.Drawing.Size(75, 23);
            this.butCancel.TabIndex = 6;
            this.butCancel.Text = "Cancel";
            this.butCancel.UseVisualStyleBackColor = true;
            // 
            // butOK
            // 
            this.butOK.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butOK.DialogResult = System.Windows.Forms.DialogResult.OK;
            this.butOK.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butOK.Location = new System.Drawing.Point(93, 419);
            this.butOK.Name = "butOK";
            this.butOK.Size = new System.Drawing.Size(75, 23);
            this.butOK.TabIndex = 5;
            this.butOK.Text = "OK";
            this.butOK.UseVisualStyleBackColor = true;
            this.butOK.Click += new System.EventHandler(this.butOK_Click);
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.chkNoExport);
            this.groupBox2.Controls.Add(this.chkShowSubMeshesBoundingBox);
            this.groupBox2.Controls.Add(this.chkShowBoundingBox);
            this.groupBox2.Controls.Add(this.chkOptimize);
            this.groupBox2.Controls.Add(this.chkPickable);
            this.groupBox2.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox2.Location = new System.Drawing.Point(12, 77);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(319, 154);
            this.groupBox2.TabIndex = 2;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "Misc.";
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
            // chkShowSubMeshesBoundingBox
            // 
            this.chkShowSubMeshesBoundingBox.AutoSize = true;
            this.chkShowSubMeshesBoundingBox.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkShowSubMeshesBoundingBox.Location = new System.Drawing.Point(21, 120);
            this.chkShowSubMeshesBoundingBox.Name = "chkShowSubMeshesBoundingBox";
            this.chkShowSubMeshesBoundingBox.Size = new System.Drawing.Size(184, 17);
            this.chkShowSubMeshesBoundingBox.TabIndex = 3;
            this.chkShowSubMeshesBoundingBox.Text = "Show submeshes bounding boxes";
            this.chkShowSubMeshesBoundingBox.ThreeState = true;
            this.chkShowSubMeshesBoundingBox.UseVisualStyleBackColor = true;
            // 
            // chkShowBoundingBox
            // 
            this.chkShowBoundingBox.AutoSize = true;
            this.chkShowBoundingBox.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkShowBoundingBox.Location = new System.Drawing.Point(21, 97);
            this.chkShowBoundingBox.Name = "chkShowBoundingBox";
            this.chkShowBoundingBox.Size = new System.Drawing.Size(117, 17);
            this.chkShowBoundingBox.TabIndex = 2;
            this.chkShowBoundingBox.Text = "Show bounding box";
            this.chkShowBoundingBox.ThreeState = true;
            this.chkShowBoundingBox.UseVisualStyleBackColor = true;
            // 
            // chkOptimize
            // 
            this.chkOptimize.AutoSize = true;
            this.chkOptimize.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkOptimize.Location = new System.Drawing.Point(21, 74);
            this.chkOptimize.Name = "chkOptimize";
            this.chkOptimize.Size = new System.Drawing.Size(131, 17);
            this.chkOptimize.TabIndex = 1;
            this.chkOptimize.Text = "Try to optimize vertices";
            this.chkOptimize.ThreeState = true;
            this.chkOptimize.UseVisualStyleBackColor = true;
            // 
            // chkPickable
            // 
            this.chkPickable.AutoSize = true;
            this.chkPickable.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.chkPickable.Location = new System.Drawing.Point(21, 51);
            this.chkPickable.Name = "chkPickable";
            this.chkPickable.Size = new System.Drawing.Size(64, 17);
            this.chkPickable.TabIndex = 0;
            this.chkPickable.Text = "Pickable";
            this.chkPickable.ThreeState = true;
            this.chkPickable.UseVisualStyleBackColor = true;
            // 
            // groupBox3
            // 
            this.groupBox3.Controls.Add(this.grpAutoAnimate);
            this.groupBox3.Controls.Add(this.chkAutoAnimate);
            this.groupBox3.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox3.Location = new System.Drawing.Point(12, 237);
            this.groupBox3.Name = "groupBox3";
            this.groupBox3.Size = new System.Drawing.Size(319, 156);
            this.groupBox3.TabIndex = 4;
            this.groupBox3.TabStop = false;
            this.groupBox3.Text = "Animations";
            // 
            // grpAutoAnimate
            // 
            this.grpAutoAnimate.Controls.Add(this.chkLoop);
            this.grpAutoAnimate.Controls.Add(this.nupTo);
            this.grpAutoAnimate.Controls.Add(this.label2);
            this.grpAutoAnimate.Controls.Add(this.nupFrom);
            this.grpAutoAnimate.Controls.Add(this.label1);
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
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(6, 42);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(23, 13);
            this.label2.TabIndex = 4;
            this.label2.Text = "To:";
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
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(6, 16);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(33, 13);
            this.label1.TabIndex = 2;
            this.label1.Text = "From:";
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
            // ObjectPropertiesForm
            // 
            this.AcceptButton = this.butOK;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.butCancel;
            this.ClientSize = new System.Drawing.Size(343, 454);
            this.Controls.Add(this.groupBox3);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.butCancel);
            this.Controls.Add(this.butOK);
            this.Controls.Add(this.groupBox1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
            this.Name = "ObjectPropertiesForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Babylon.js - Object Properties";
            this.Load += new System.EventHandler(this.ObjectPropertiesForm_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            this.groupBox3.ResumeLayout(false);
            this.groupBox3.PerformLayout();
            this.grpAutoAnimate.ResumeLayout(false);
            this.grpAutoAnimate.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupTo)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupFrom)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.CheckBox chkCollisions;
        private System.Windows.Forms.Button butCancel;
        private System.Windows.Forms.Button butOK;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.CheckBox chkPickable;
        private System.Windows.Forms.CheckBox chkOptimize;
        private System.Windows.Forms.CheckBox chkShowSubMeshesBoundingBox;
        private System.Windows.Forms.CheckBox chkShowBoundingBox;
        private System.Windows.Forms.GroupBox groupBox3;
        private System.Windows.Forms.GroupBox grpAutoAnimate;
        private System.Windows.Forms.CheckBox chkLoop;
        private System.Windows.Forms.NumericUpDown nupTo;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.NumericUpDown nupFrom;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.CheckBox chkAutoAnimate;
        private System.Windows.Forms.CheckBox chkNoExport;
    }
}