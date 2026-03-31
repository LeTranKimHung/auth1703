const { sendUserPassword } = require("../utils/mailHandler");

async function testMail() {
    console.log("Starting Mailtrap test...");
    const result = await sendUserPassword("test@haha.com", "TestUser", "StrongPassword123!");
    if (result) {
        console.log("Test successful! Check your Mailtrap inbox.");
    } else {
        console.log("Test failed! Please check your credentials and network.");
    }
}

testMail();
