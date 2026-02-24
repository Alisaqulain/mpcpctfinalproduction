  import { NextResponse } from "next/server";
  import dbConnect from "@/lib/db";
  import User from "@/lib/models/User";
  import bcrypt from "bcryptjs";

  export async function POST(request) {
    try {
      // Hardcoded admin credentials (requested)
      const adminName = "Admin";
      const adminEmail = "admin@mpcpct.com";
      const adminPhone = "7869654042";
      const adminPassword = "Admin@1234";
      const adminState = "NA";
      const adminCity = "NA";

      await dbConnect();

      // Guard: do not proceed if this phone already belongs to some other account/email
      const existingByPhone = await User.findOne({ phoneNumber: adminPhone });
      if (existingByPhone && existingByPhone.email !== adminEmail) {
        return NextResponse.json({ error: `Phone ${adminPhone} already exists for another account.` }, { status: 409 });
      }

      let user = await User.findOne({ $or: [{ email: adminEmail }, { phoneNumber: adminPhone }] });

      const hashed = await bcrypt.hash(adminPassword, 10);

      if (!user) {
        user = new User({
          name: adminName,
          email: adminEmail,
          phoneNumber: adminPhone,
          password: hashed,
          states: adminState,
          city: adminCity,
          profileUrl: "",
          role: "admin",
        });
        await user.save();
        return NextResponse.json({ message: "Admin created", id: user._id });
      } else {
        // ensure role is admin and password matches env
        user.role = "admin";
        user.password = hashed;
        user.name = adminName;
        user.phoneNumber = adminPhone;
        user.states = adminState;
        user.city = adminCity;
        await user.save();
        return NextResponse.json({ message: "Admin updated", id: user._id });
      }
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }


