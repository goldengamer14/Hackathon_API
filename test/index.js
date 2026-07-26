import fs from "fs";

let signInBetterAuthSessionCookieAdmin = "";
let signInBetterAuthSessionCookiePariticipant = "";

// Load cookie from file if present
try {
    const c = fs.readFileSync("./test/cookie.tmp", "utf8");
    if (c) signInBetterAuthSessionCookieAdmin = c;
} catch (e) {
    // ignore if file doesn't exist
}

// Load cookie from file if present
try {
    const c = fs.readFileSync("./test/cookie_participant.tmp", "utf8");
    if (c) signInBetterAuthSessionCookiePariticipant = c;
} catch (e) {
    // ignore if file doesn't exist
}

async function testRateLimiter() {
    for (let i = 0; i < 60; ++i) {
        await fetch('http://localhost:3000', {
            method: "GET",
            headers: {
                "Content-Type": "application/text",
                "Origin": "http://localhost:3000"
            },
        })
            .then(res => res.json())
            .then(data => {
                console.log(i + 1, ": ");
                console.table(data);
            })
            .catch(err => console.error(err));
    }

    console.log("End of test. Check the console for rate limiter responses.");
}

async function testSignUp() {
    // Create user with role to be changed to ADMIN from PRISMA STUDIO
    await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        },
        body: JSON.stringify({
            name: "John Dick",
            email: "john@example.com",
            password: "Abcd321!"
        })
    })
        .then(res => res.json())
        .then(data => console.log("Sign-up response:", data))
        .catch(err => console.error(err));

    // Create user to stay with PARTICIPANT role
    await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        },
        body: JSON.stringify({
            name: "Elena Jaw",
            email: "elena@example.com",
            password: "Elena@123"
        })
    })
        .then(res => res.json())
        .then(data => console.log("Sign-up response:", data))
        .catch(err => console.error(err));
}

async function testSignIn() {
    // Sign-in as user with ADMIN role
    await fetch("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        },
        body: JSON.stringify({
            email: "john@example.com",
            password: "Abcd321!"
        })
    })
        .then(res => {
            return [res.json(), res.headers];
        })
        .then(([data, headers]) => {
            console.log(data);
            // store headers object reference and persist to file
            signInBetterAuthSessionCookieAdmin = headers.getSetCookie();
            // persist header entries to ./cookie.tmp
            try {
                // const serialized = JSON.stringify(Array.from(headers.entries()));
                fs.promises.writeFile("./cookie.tmp", signInBetterAuthSessionCookieAdmin).catch(() => {});
            } catch (e) {}
            console.log("better-auth.session_cookie:", signInBetterAuthSessionCookieAdmin);
        })
        .catch(err => console.error(err));


    // Sign-in as user with PARTICIPANT role
    await fetch("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        },
        body: JSON.stringify({
            email: "elena@example.com",
            password: "Elena@123"
        })
    })
        .then(res => {
            return [res.json(), res.headers];
        })
        .then(([data, headers]) => {
            console.log(data);
            // store headers object reference and persist to file
            signInBetterAuthSessionCookiePariticipant = headers.getSetCookie();
            // persist header entries to ./cookie.tmp
            try {
                // const serialized = JSON.stringify(Array.from(headers.entries()));
                fs.promises.writeFile("./cookie_participant.tmp", signInBetterAuthSessionCookiePariticipant).catch(() => {});
            } catch (e) {}
            console.log("better-auth.session_cookie:", signInBetterAuthSessionCookiePariticipant);
        })
        .catch(err => console.error(err));
}

async function testGet() {
    // Valid Guest Requests (As ADMIN)

    console.log("[ADMIN]: All Users:\n");
    await fetch("http://localhost:3000/users/all", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Cookie": signInBetterAuthSessionCookieAdmin
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));

    console.log("\n[ADMIN]: One User:\n");
    await fetch("http://localhost:3000/users/P5cBBLL60JyFpcxwkveQJyMb4TbXYlBP", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Cookie": signInBetterAuthSessionCookieAdmin
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))

        .catch(err => console.error(err));


    // Partially Valid Guest Requests (As PARTICIPANT)

    console.log("[PARTICIPANT]: All Users:\n");
    await fetch("http://localhost:3000/users/all", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Cookie": signInBetterAuthSessionCookiePariticipant
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));

    console.log("\n[PARTICIPANT]: One User:\n");
    await fetch("http://localhost:3000/users/P5cBBLL60JyFpcxwkveQJyMb4TbXYlBP", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Cookie": signInBetterAuthSessionCookiePariticipant
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))

        .catch(err => console.error(err));


    // Invalid Guest Requests (without logged-in session-cookie)

    console.log("\n[Invalid]: All Users:\n");
    await fetch("http://localhost:3000/users/all", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));

    console.log("\n[Invalid]: One User:\n");
    await fetch("http://localhost:3000/users/P5cBBLL60JyFpcxwkveQJyMb4TbXYlBP", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))

        .catch(err => console.error(err));
}

const main = async function () {
    // console.log("\n\nTesting Rate Limiter\n\n");
    // await testRateLimiter();

    // console.log("\n\nTesting Better Auth sign-up request\n\n");
    // await testSignUp();

    // console.log("\n\nTesting Better Auth sign-in request\n\n");
    // await testSignIn();

    console.log("\n\nTesting GET request on /users\n\n");
    await testGet();
}();
