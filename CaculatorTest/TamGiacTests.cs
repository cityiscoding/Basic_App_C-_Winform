//using CaculatorApp;
//using Microsoft.VisualStudio.TestTools.UnitTesting;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace CaculatorTest
//{
//    [TestClass]
//    public class TamGiacTest
//    {
//        [TestMethod]
//        public void TestLoaiTamGiacDeu()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(3, 3, 3);

//            // Act
//            string loaiTamGiac = tamGiac.LoaiTamGiac;

//            // Assert
//            Assert.AreEqual("Deu", loaiTamGiac);
//        }

//        [TestMethod]
//        public void TestLoaiTamGiacVuong()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(3, 4, 5);

//            // Act
//            string loaiTamGiac = tamGiac.LoaiTamGiac;

//            // Assert
//            Assert.AreEqual("Vuong", loaiTamGiac);
//        }

//        [TestMethod]
//        public void TestLoaiTamGiacCan()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(3, 4, 3);

//            // Act
//            string loaiTamGiac = tamGiac.LoaiTamGiac;

//            // Assert
//            Assert.AreEqual("Can", loaiTamGiac);
//        }

//        [TestMethod]
//        public void TestLoaiTamGiacThuong()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(3, 4, 6);

//            // Act
//            string loaiTamGiac = tamGiac.LoaiTamGiac;

//            // Assert
//            Assert.AreEqual("Thuong", loaiTamGiac);
//        }

//        [TestMethod]
//        public void TestLoaiTamGiacKhongHopLe()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(1, 2, 3);

//            // Act
//            string loaiTamGiac = tamGiac.LoaiTamGiac;

//            // Assert
//            Assert.AreEqual("khong hop le. Xin kiem tra lai !", loaiTamGiac);
//        }

//        [TestMethod]
//        public void TestTinhChuVi()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(3, 4, 5);

//            // Act
//            double chuVi = tamGiac.TinhChuVi();

//            // Assert
//            Assert.AreEqual(12, chuVi);
//        }

//        [TestMethod]
//        public void TestTinhDienTich()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(3, 4, 5);

//            // Act
//            double dienTich = tamGiac.TinhDienTich();

//            // Assert
//            Assert.AreEqual(6, dienTich);
//        }

//        [TestMethod]
//        public void TestTinhChuViKhongHopLe()
//        {
//            // Arrange
//            TamGiac tamGiac = new TamGiac(1, 2, 3);

//            // Act
//            double chuVi = tamGiac.TinhChuVi();

//            // Assert
//            Assert.AreEqual(0, chuVi);
//        }

//        [TestMethod]
//        public void TestTinhDienTichKhongHopLe()
//        {
//            // Arrange
//            TamGiac tamiac = new TamGiac(1, 2, 3);

//            // Act
//            double dienTich = tamiac.TinhDienTich();

//            // Assert
//            Assert.AreEqual(0, dienTich);
//        }

//    }
//}
