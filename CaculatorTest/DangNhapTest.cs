//using CalculatorApp;
//using Microsoft.VisualStudio.TestTools.UnitTesting;
//using System;
//using System.Collections.Generic;
//using System.Data.SqlClient;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;
//using System.Windows.Forms;
//using Microsoft.VisualStudio.TestTools.UITesting;

//namespace CaculatorTest
//{
//    [TestClass]
//    public class DangNhapTest
//    {



//        // sử dụng phương thức Assert.IsTrue để kiểm tra kết nối đến cơ sở dữ liệu.
//        // Nếu kết nối thành công, biến isConnected sẽ được đặt thành true và phương thức
//        // Assert.IsTrue sẽ đảm bảo rằng giá trị của biến này là true. Nếu kết nối thất bại,
//        // biến này sẽ giữ nguyên giá trị mặc định là false và phương thức Assert.IsTrue sẽ báo lỗi.
//        //[TestMethod]
//        //public void TestDatabaseConnection()
//        //{
//        //    // Arrange
//        //    string connectionString = "Data Source=DESKTOP-E532F7N;Initial Catalog=TEST;Integrated Security=True";

//        //    // Act
//        //    bool isConnected = false;
//        //    try
//        //    {
//        //        using (SqlConnection con = new SqlConnection(connectionString))
//        //        {
//        //            con.Open();
//        //            isConnected = true;
//        //        }
//        //    }
//        //    catch (Exception)
//        //    {
//        //        isConnected = false;
//        //    }

//        //    // Assert
//        //    Assert.IsTrue(isConnected, "Failed to connect to database.");
//        //}


//        //[TestMethod]
//        //public void TestKiemTraThongTin()
//        //{
//        //    string TenDangNhap = null;
//        //    string MatKhau = null;

//        //    bool actual = XL_DangNhap.KiemTraThongTin(TenDangNhap, MatKhau);

//        //    Assert.IsFalse(actual);
//        //}



//        //test case dang nhap
//        //[TestMethod]
//        //public void TestDangNhapdungHienthongBaoxinchao()
//        //{
//        //    // Arrange
//        //    string tenDangNhap = "Tranthanhpho";
//        //    string matKhau = "Abc123@.";

//        //    // Act
//        //    bool result = XL_DangNhap.DangNhap(tenDangNhap, matKhau);

//        //    // Assert
//        //    Assert.IsTrue(result);
//        //    Assert.AreEqual(MessageBox.Show($"Xin chào '{tenDangNhap}'", "Đăng nhập thành công!", MessageBoxButtons.OK, MessageBoxIcon.Information, MessageBoxDefaultButton.Button1), DialogResult.OK);
//        //}



//        //test ang nhap thong tin sai
//        //[TestMethod]
//        //public void DangNhap_ThongTinSai_TraVeFalseVaHienThiThongBaoLoi()
//        //{
//        //    // Arrange
//        //    string tenDangNhap = "UsernameSai";
//        //    string matKhau = "Passwordsai1";

//        //    // Act
//        //    bool result = XL_DangNhap.DangNhap(tenDangNhap, matKhau);

//        //    // Assert
//        //    bool messageBoxShown = MessageBoxShown("Tên đăng nhập hoặc mật khẩu không đúng.", "Đăng nhập thất bại!");
//        //    Assert.IsFalse(result == false && messageBoxShown);
//        //}


//        //private bool MessageBoxShown(string message, string caption)
//        //{
//        //    Form activeForm = Form.ActiveForm;
//        //    if (activeForm != null && activeForm is MessageBox)
//        //    {
//        //        Form msgBox = activeForm;
//        //        if (msgBox.Text == caption && msgBox.ToString() == message)
//        //        {
//        //            return true;
//        //        }
//        //    }
//        //    return false;
//        }


//    }
//}
