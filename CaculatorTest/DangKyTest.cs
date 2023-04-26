using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CaculatorApp;
using System.Windows.Forms;
using System.Data;

namespace CaculatorTest
{
    [TestClass]
    public class DangKyTest
    {

        private static readonly string ConnectionString = "Data Source=DESKTOP-E532F7N;Initial Catalog=TEST;Integrated Security=True";
        private static readonly string SelectQuery = "SELECT COUNT(*) FROM [User] WHERE username = @username OR phone = @phone";
        private static readonly string InsertQuery = "INSERT INTO [User] (username, password, phone) VALUES (@username, @password, @phone)";
        [TestMethod]
        public void TestDatabaseConnectionSuccess()
        {
            using (SqlConnection con = new SqlConnection(ConnectionString))
            {
                con.Open();
                Assert.IsTrue(con.State == ConnectionState.Open);
            }
        }

        [TestMethod]
        public void DangKyTest_NhapDuLieuRong()
        {
            // Arrange
            string TenDangNhap = "";
            string MatKhau = "";
            string Phone = "";

            // Act
            bool result = XL_DangKy.DangKy(TenDangNhap, MatKhau, Phone);

            // Assert
            Assert.IsFalse(result);
        }

        //test dang ky nhap du lieu
        [TestMethod]
        public void TestNhapDuLieu()
        {
            string TenDangNhap = "Adminnnn";
            string MatKhau = "MatKhau123";
            string Phone = "0857332962";
            bool resulf = XL_DangKy.DangKy(TenDangNhap, MatKhau, Phone);
            Assert.IsTrue(resulf);
        }

        //kiem tra username or phone da ton tai chưa
        [TestMethod]
        public void KiemTraUserNamePhone()
        {
            // Arrange
            string username = "Adminn";
            string phone = "0123456739";

            // Act
            bool result = XL_DangKy.KiemTraUserNamePhone(username, phone);

            // Assert
            Assert.IsFalse(result);
        }

    }

}

