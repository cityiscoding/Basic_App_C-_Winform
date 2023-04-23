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
    public partial class frmApp1 : Form
    {
        public frmApp1()
        {
            InitializeComponent();
        }
        private void button1_Click(object sender, EventArgs e)
        {
            string so1 = txtSo1.Text;
            string so2 = txtSo2.Text;
            int result = Calculator.Add(so1, so2);
            txtKq.Text = result.ToString();
        }

        private void btnTru_Click(object sender, EventArgs e)
        {
            string so1 = txtSo1.Text;
            string so2 = txtSo2.Text;
            int result = Calculator.Sub(so1, so2);
            txtKq.Text = result.ToString();
        }

        private void btnNhan_Click(object sender, EventArgs e)
        {
            string so1 = txtSo1.Text;
            string so2 = txtSo2.Text;
            int result = Calculator.Mul(so1, so2);
            txtKq.Text = result.ToString();
        }

        private void btnChia_Click(object sender, EventArgs e)
        {
            string so1 = txtSo1.Text;
            string so2 = txtSo2.Text;
            int result = Calculator.Div(so1, so2);
            txtKq.Text = result.ToString();
        }


        private void btnClear_Click(object sender, EventArgs e)
        {
            txtKq.Text = "";
            txtSo1.Text = "";
            txtSo2.Text = "";
        }
        private void btnBack_Click(object sender, EventArgs e)
        {
            frmManHinhChinh mhc = new frmManHinhChinh();
            this.Hide();
            mhc.Show();
        }
        private void frmApp1_FormClosing(object sender, FormClosingEventArgs e)
        {
            Program.ExitApplication();
        }
    }

}
