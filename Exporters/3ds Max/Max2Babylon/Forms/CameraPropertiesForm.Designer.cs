namespace Max2Babylon
{
    partial class CameraPropertiesForm
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
            this.chkGravity = new System.Windows.Forms.CheckBox();
            this.chkCollisions = new System.Windows.Forms.CheckBox();
            this.butOK = new System.Windows.Forms.Button();
            this.butCancel = new System.Windows.Forms.Button();
            this.groupBox2 = new System.Windows.Forms.GroupBox();
            this.label2 = new System.Windows.Forms.Label();
            this.nupInertia = new System.Windows.Forms.NumericUpDown();
            this.label1 = new System.Windows.Forms.Label();
            this.nupSpeed = new System.Windows.Forms.NumericUpDown();
            this.label3 = new System.Windows.Forms.Label();
            this.ellipsoidControl = new Max2Babylon.Vector3Control();
            this.groupBox1.SuspendLayout();
            this.groupBox2.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupInertia)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupSpeed)).BeginInit();
            this.SuspendLayout();
            // 
            // groupBox1
            // 
            this.groupBox1.Controls.Add(this.ellipsoidControl);
            this.groupBox1.Controls.Add(this.label3);
            this.groupBox1.Controls.Add(this.chkGravity);
            this.groupBox1.Controls.Add(this.chkCollisions);
            this.groupBox1.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox1.Location = new System.Drawing.Point(12, 12);
            this.groupBox1.Name = "groupBox1";
            this.groupBox1.Size = new System.Drawing.Size(319, 138);
            this.groupBox1.TabIndex = 0;
            this.groupBox1.TabStop = false;
            this.groupBox1.Text = "Collisions";
            // 
            // chkGravity
            // 
            this.chkGravity.AutoSize = true;
            this.chkGravity.Location = new System.Drawing.Point(21, 51);
            this.chkGravity.Name = "chkGravity";
            this.chkGravity.Size = new System.Drawing.Size(86, 17);
            this.chkGravity.TabIndex = 1;
            this.chkGravity.Text = "Apply gravity";
            this.chkGravity.ThreeState = true;
            this.chkGravity.UseVisualStyleBackColor = true;
            // 
            // chkCollisions
            // 
            this.chkCollisions.AutoSize = true;
            this.chkCollisions.Location = new System.Drawing.Point(21, 28);
            this.chkCollisions.Name = "chkCollisions";
            this.chkCollisions.Size = new System.Drawing.Size(102, 17);
            this.chkCollisions.TabIndex = 0;
            this.chkCollisions.Text = "Check collisions";
            this.chkCollisions.ThreeState = true;
            this.chkCollisions.UseVisualStyleBackColor = true;
            // 
            // butOK
            // 
            this.butOK.Anchor = System.Windows.Forms.AnchorStyles.Bottom;
            this.butOK.DialogResult = System.Windows.Forms.DialogResult.OK;
            this.butOK.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.butOK.Location = new System.Drawing.Point(93, 304);
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
            this.butCancel.Location = new System.Drawing.Point(174, 304);
            this.butCancel.Name = "butCancel";
            this.butCancel.Size = new System.Drawing.Size(75, 23);
            this.butCancel.TabIndex = 2;
            this.butCancel.Text = "Cancel";
            this.butCancel.UseVisualStyleBackColor = true;
            // 
            // groupBox2
            // 
            this.groupBox2.Controls.Add(this.label2);
            this.groupBox2.Controls.Add(this.nupInertia);
            this.groupBox2.Controls.Add(this.label1);
            this.groupBox2.Controls.Add(this.nupSpeed);
            this.groupBox2.FlatStyle = System.Windows.Forms.FlatStyle.Flat;
            this.groupBox2.Location = new System.Drawing.Point(12, 156);
            this.groupBox2.Name = "groupBox2";
            this.groupBox2.Size = new System.Drawing.Size(319, 140);
            this.groupBox2.TabIndex = 3;
            this.groupBox2.TabStop = false;
            this.groupBox2.Text = "Control";
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(21, 81);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(36, 13);
            this.label2.TabIndex = 3;
            this.label2.Text = "Inertia";
            // 
            // nupInertia
            // 
            this.nupInertia.DecimalPlaces = 2;
            this.nupInertia.Location = new System.Drawing.Point(24, 103);
            this.nupInertia.Name = "nupInertia";
            this.nupInertia.Size = new System.Drawing.Size(120, 20);
            this.nupInertia.TabIndex = 2;
            this.nupInertia.Value = new decimal(new int[] {
            9,
            0,
            0,
            65536});
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(21, 28);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(41, 13);
            this.label1.TabIndex = 1;
            this.label1.Text = "Speed:";
            // 
            // nupSpeed
            // 
            this.nupSpeed.DecimalPlaces = 1;
            this.nupSpeed.Location = new System.Drawing.Point(24, 50);
            this.nupSpeed.Name = "nupSpeed";
            this.nupSpeed.Size = new System.Drawing.Size(120, 20);
            this.nupSpeed.TabIndex = 0;
            this.nupSpeed.Value = new decimal(new int[] {
            1,
            0,
            0,
            0});
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(18, 79);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(48, 13);
            this.label3.TabIndex = 2;
            this.label3.Text = "Ellipsoid:";
            // 
            // ellipsoidControl
            // 
            this.ellipsoidControl.Location = new System.Drawing.Point(21, 95);
            this.ellipsoidControl.Name = "ellipsoidControl";
            this.ellipsoidControl.Size = new System.Drawing.Size(294, 28);
            this.ellipsoidControl.TabIndex = 3;
            this.ellipsoidControl.X = 0F;
            this.ellipsoidControl.Y = 0F;
            this.ellipsoidControl.Z = 0F;
            // 
            // CameraPropertiesForm
            // 
            this.AcceptButton = this.butOK;
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.CancelButton = this.butCancel;
            this.ClientSize = new System.Drawing.Size(343, 339);
            this.Controls.Add(this.groupBox2);
            this.Controls.Add(this.butCancel);
            this.Controls.Add(this.butOK);
            this.Controls.Add(this.groupBox1);
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
            this.Name = "CameraPropertiesForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Babylon.js - Camera Properties";
            this.Load += new System.EventHandler(this.CameraPropertiesForm_Load);
            this.groupBox1.ResumeLayout(false);
            this.groupBox1.PerformLayout();
            this.groupBox2.ResumeLayout(false);
            this.groupBox2.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)(this.nupInertia)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.nupSpeed)).EndInit();
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.GroupBox groupBox1;
        private System.Windows.Forms.Button butOK;
        private System.Windows.Forms.Button butCancel;
        private System.Windows.Forms.CheckBox chkCollisions;
        private System.Windows.Forms.CheckBox chkGravity;
        private System.Windows.Forms.GroupBox groupBox2;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.NumericUpDown nupSpeed;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.NumericUpDown nupInertia;
        private System.Windows.Forms.Label label3;
        private Vector3Control ellipsoidControl;
    }
}