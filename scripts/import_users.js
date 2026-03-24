const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const User = require("../schemas/users");
const Role = require("../schemas/roles");
const { sendUserPassword } = require("../utils/mailHandler");

// Function to generate random password of length 16
function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 16; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
}

mongoose.connect("mongodb://localhost:27017/NNPTUD-S3")
    .then(async () => {
        console.log("Connected to MongoDB...");

        // Find the 'user' role
        const userRole = await Role.findOne({ name: { $regex: /^user$/i } });
        if (!userRole) {
            console.error("User role not found! Please check if a role named 'user' exists in the database.");
            process.exit(1);
        }

        const filePath = path.join(__dirname, "../users.txt");
        if (!fs.existsSync(filePath)) {
            console.error("users.txt not found in root.");
            process.exit(1);
        }

        const data = fs.readFileSync(filePath, "utf8");
        const lines = data.split("\n").filter(line => line.trim() !== "");

        console.log(`Found ${lines.length} users to import.`);

        for (const line of lines) {
            // Split by tab or multiple spaces
            const parts = line.split(/\s+/).filter(p => p.trim() !== "");
            if (parts.length < 2) continue;

            const username = parts[0];
            const email = parts[1];
            const password = generatePassword();

            try {
                // Check if user already exists
                let user = await User.findOne({ email });
                if (!user) {
                    user = new User({
                        username,
                        email,
                        password, // Pre-save hook will hash this
                        role: userRole._id,
                        status: true
                    });
                    await user.save();
                    console.log(`[CREATED] User: ${username} (${email}) | Password: ${password}`);
                    
                    // Send password via email with timeout
                    try {
                        const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
                        await Promise.race([sendUserPassword(email, username, password), timeout(2000)]);
                    } catch (e) {
                        console.log(`[MAIL ERROR] for ${email}: ${e.message}`);
                    }
                } else {
                    console.log(`[SKIP] User already exists: ${email}`);
                }
            } catch (err) {
                console.error(`[ERROR] Processing user ${username}:`, err.message);
            }
        }

        console.log("--- Import Process Finished ---");
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection error:", err);
        process.exit(1);
    });
