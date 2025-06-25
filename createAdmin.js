// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const User = require("./models/Employee"); // Adjust path if needed

// (async () => {
//   try {
//     await mongoose.connect("mongodb://localhost:27017/employee", {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     const existing = await User.findOne({ loginId: "admin@gmail.com" });
//     if (existing) {
//       console.log("⚠️ Admin already exists. Deleting...");
//       await User.deleteOne({ loginId: "admin@gmail.com" });
//     }

//     const passwordHash = await bcrypt.hash("Fed@123", 10);

//     const admin = new User({
//       name: "admin",
//       email: "admin@gmail.com",
//       loginId: "admin@gmail.com",
//       passwordHash,
//       role: "admin",
//     });

//     await admin.save();
//     console.log("✅ Admin created");

//     const saved = await User.findOne({ loginId: "admin@gmail.com" });
//     console.log("🔍 Saved Admin User:", saved);

//     process.exit();
//   } catch (err) {
//     console.error("❌ Error:", err);
//     process.exit(1);
//   }
// })();
