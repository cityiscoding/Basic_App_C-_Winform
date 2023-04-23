using CalculatorApp;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace CaculatorApp
{
    public partial class frmQuenMatKhau : Form
    {
        public frmQuenMatKhau()
        {
            InitializeComponent();
        }
        private void btnTimMatKhau_Click(object sender, EventArgs e)
        {
            string Phone = txtPhone.Text.Trim();
            XL_QuenMatKhau.QuenMatKhau(Phone);
        }
        private void btnBack_Click_1(object sender, EventArgs e)
        {
            frmDangNhap fdn = new frmDangNhap();
            this.Hide();
            fdn.Show();
        }

        private void frmQuenMatKhau_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }

        private void frmTimMatKhau_KeyDown_ENTER(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.Enter)
            {
                btnTimMatKhau_Click(sender, e);
            }
        }

        private void frmQuenMatKhau_Load(object sender, EventArgs e)
        {
            this.KeyPreview = true;
        }

        private void frmQuenMatKhau_KeyPress(object sender, KeyPressEventArgs e)
        {
            if (e.KeyChar == (char)Keys.Enter)
            {
                e.Handled = true;
            }
        }
    }
}
