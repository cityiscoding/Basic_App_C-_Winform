//using CaculatorApp;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using Microsoft.VisualStudio.TestTools.UnitTesting;
//using System.Threading.Tasks;

//namespace CaculatorTest
//{
//    public class PhanSoTest
//    {
//        [TestClass]
//        public class PhanSoTests
//        {
//            [TestMethod]
//            public void TestCong()
//            {
//                // Arrange
//                PhanSo ps1 = new PhanSo(1, 2);
//                PhanSo ps2 = new PhanSo(1, 3);

//                // Act
//                PhanSo result = ps1.Cong(ps2);

//                // Assert
//                Assert.AreEqual("5/6", result.ToString());
//            }

//            [TestMethod]
//            public void TestTru()
//            {
//                // Arrange
//                PhanSo ps1 = new PhanSo(1, 2);
//                PhanSo ps2 = new PhanSo(1, 3);

//                // Act
//                PhanSo result = ps1.Tru(ps2);

//                // Assert
//                Assert.AreEqual("1/6", result.ToString());
//            }
//            [TestMethod]
//            public void TestNhan()
//            {
//                // Arrange
//                PhanSo ps1 = new PhanSo(2, 3);
//                PhanSo ps2 = new PhanSo(3, 4);

//                // Act
//                PhanSo result = ps1.Nhan(ps2);

//                // Assert
//                Assert.AreEqual("6/12", result.ToString());
//            }

//            // Test case for Chia() method
//            [TestMethod]
//            public void TestChia()
//            {
//                // Arrange
//                PhanSo ps1 = new PhanSo(5, 6);
//                PhanSo ps2 = new PhanSo(2, 3);

//                // Act
//                PhanSo result = ps1.Chia(ps2);

//                // Assert
//                Assert.AreEqual("15/12", result.ToString());
//            }
//        }
//    }
//}
