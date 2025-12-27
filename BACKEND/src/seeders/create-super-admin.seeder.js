import "dotenv/config";
import bcrypt from "bcrypt";
import { connectDB, disconnectDB } from "../infrastructure/db/database.js";
import * as OrganizationRepositories from "../modules/repositories/organization.repositories.js";
import * as UsersRepositories from "../modules/repositories/user.repositories.js";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@finshield.com";
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || "super_admin";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "Admin123!@#";

async function createSuperAdmin() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Step 1: Find or create platform organization
    console.log("Checking for platform organization...");
    let platformOrg = await OrganizationRepositories.findOne({ type: "platform" });

    if (!platformOrg) {
      console.log("Creating platform organization...");
      platformOrg = await OrganizationRepositories.createOrganization({
        name: "FinShield Platform",
        type: "platform",
        status: "active",
      });
      console.log(`✅ Platform organization created with ID: ${platformOrg._id}`);
    } else {
      console.log(`✅ Platform organization already exists with ID: ${platformOrg._id}`);
    }

    // Step 2: Check if super admin already exists
    console.log("Checking for existing super admin...");
    const existingAdmin = await UsersRepositories.findByEmail(SUPER_ADMIN_EMAIL);

    if (existingAdmin) {
      console.log(`⚠️  Super admin already exists with email: ${SUPER_ADMIN_EMAIL}`);
      console.log("Skipping creation...");
      await disconnectDB();
      return;
    }

    // Step 3: Hash the password
    console.log("Hashing password...");
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

    // Step 4: Create super admin user
    console.log("Creating super admin user...");
    const superAdmin = await UsersRepositories.create({
      orgId: platformOrg._id,
      portal: "admin",
      role: "SUPER_ADMIN",
      email: SUPER_ADMIN_EMAIL,
      username: SUPER_ADMIN_USERNAME,
      passwordHash,
      status: "active",
      mustChangePassword: true, // Force password change on first login
      createdByUserId: null, // First user, created via seeder
    });

    console.log("✅ Super admin created successfully!");
    console.log("📧 Email:", SUPER_ADMIN_EMAIL);
    console.log("👤 Username:", SUPER_ADMIN_USERNAME);
    console.log("🔑 Password:", SUPER_ADMIN_PASSWORD);
    console.log("⚠️  Note: User must change password on first login");
    console.log("🆔 User ID:", superAdmin._id);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    await disconnectDB();
    process.exit(1);
  }
}

// Run the seeder
createSuperAdmin();

