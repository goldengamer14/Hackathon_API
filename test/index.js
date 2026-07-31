import fs from "fs";

let signInBetterAuthSessionCookieAdmin = "";
let signInBetterAuthSessionCookiePariticipant = "";
let createdHackathonId = "";

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

// --- shared helpers ---

function futureDate(daysFromNow) {
    return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

async function request(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            ...(options.headers ?? {}),
        },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
}

function report(label, status, data) {
    console.log(`${label} -> [${status}]`, data);
}

// --- User / auth tests (unchanged behavior, light formatting cleanup) ---

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
            signInBetterAuthSessionCookieAdmin = headers.getSetCookie();
            try {
                fs.promises.writeFile("./test/cookie.tmp", signInBetterAuthSessionCookieAdmin).catch(() => {});
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
            signInBetterAuthSessionCookiePariticipant = headers.getSetCookie();
            try {
                fs.promises.writeFile("./test/cookie_participant.tmp", signInBetterAuthSessionCookiePariticipant).catch(() => {});
            } catch (e) {}
            console.log("better-auth.session_cookie:", signInBetterAuthSessionCookiePariticipant);
        })
        .catch(err => console.error(err));
}

async function testGetUsers() {
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
    await fetch("http://localhost:3000/users/BUuyHiJ8w6EbaBnHVhEA9gCFU2plIRFj", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Cookie": signInBetterAuthSessionCookieAdmin
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));

    console.log("\n[PARTICIPANT]: All Users:\n");
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
    await fetch("http://localhost:3000/users/BUuyHiJ8w6EbaBnHVhEA9gCFU2plIRFj", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000",
            "Cookie": signInBetterAuthSessionCookiePariticipant
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));

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
    await fetch("http://localhost:3000/users/BUuyHiJ8w6EbaBnHVhEA9gCFU2plIRFj", {
        headers: {
            "Content-Type": "application/json",
            "Origin": "http://localhost:3000"
        }
    })
        .then(res => res.json())
        .then(data => console.log(data))
        .catch(err => console.error(err));
}

// --- Hackathon tests ---

const validHackathonPayload = {
    name: "Node Nights Hackathon",
    description: "A 48-hour hackathon focused on building innovative Node.js applications.",
    startDate: futureDate(7),
    endDate: futureDate(9),
    isActive: true,
};

const invalidHackathonPayloads = [
    {
        label: "Missing name",
        payload: {
            description: "A hackathon with no name provided in this payload at all.",
            startDate: futureDate(7),
            endDate: futureDate(9),
        },
    },
    {
        label: "Description too short",
        payload: {
            name: "Short Desc Hackathon",
            description: "too short",
            startDate: futureDate(7),
            endDate: futureDate(9),
        },
    },
    {
        label: "startDate in the past",
        payload: {
            name: "Past Start Hackathon",
            description: "This hackathon has a start date set incorrectly in the past.",
            startDate: futureDate(-2),
            endDate: futureDate(9),
        },
    },
    {
        label: "endDate in the past",
        payload: {
            name: "Past End Hackathon",
            description: "This hackathon has an end date set incorrectly in the past.",
            startDate: futureDate(7),
            endDate: futureDate(-1),
        },
    },
    {
        label: "isActive wrong type",
        payload: {
            name: "Bad isActive Hackathon",
            description: "This hackathon has an invalid type for the isActive field.",
            startDate: futureDate(7),
            endDate: futureDate(9),
            isActive: "yes",
        },
    },
];

async function testHackathonValidation() {
    console.log("\n--- Hackathon validation (as ADMIN) ---\n");
    for (const { label, payload } of invalidHackathonPayloads) {
        const { status, data } = await request("http://localhost:3000/hackathons", {
            method: "POST",
            headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
            body: JSON.stringify(payload),
        });
        report(`[${label}] (expect 400)`, status, data);
    }
}

async function testCreateHackathon() {
    console.log("\n--- Create Hackathon ---\n");

    // Valid create, as ADMIN — expect 201
    const created = await request("http://localhost:3000/hackathons", {
        method: "POST",
        headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
        body: JSON.stringify(validHackathonPayload),
    });
    report("[ADMIN valid create] (expect 201)", created.status, created.data);
    createdHackathonId = created.data?.data?.id ?? "";

    // As PARTICIPANT — expect 403
    const asParticipant = await request("http://localhost:3000/hackathons", {
        method: "POST",
        headers: { "Cookie": signInBetterAuthSessionCookiePariticipant },
        body: JSON.stringify(validHackathonPayload),
    });
    report("[PARTICIPANT create] (expect 403)", asParticipant.status, asParticipant.data);

    // Anonymous — expect 401
    const asAnonymous = await request("http://localhost:3000/hackathons", {
        method: "POST",
        body: JSON.stringify(validHackathonPayload),
    });
    report("[Anonymous create] (expect 401)", asAnonymous.status, asAnonymous.data);
}

async function testGetHackathons() {
    console.log("\n--- Get Hackathons ---\n");

    const asAdmin = await request("http://localhost:3000/hackathons", {
        headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
    });
    report("[ADMIN list] (expect 200)", asAdmin.status, asAdmin.data);

    const oneAsAdmin = await request(`http://localhost:3000/hackathons/${createdHackathonId}`, {
        headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
    });
    report("[ADMIN get one] (expect 200)", oneAsAdmin.status, oneAsAdmin.data);

    const asParticipant = await request("http://localhost:3000/hackathons", {
        headers: { "Cookie": signInBetterAuthSessionCookiePariticipant },
    });
    report("[PARTICIPANT list] (expect 200)", asParticipant.status, asParticipant.data);

    const asAnonymous = await request("http://localhost:3000/hackathons");
    report("[Anonymous list] (expect 401)", asAnonymous.status, asAnonymous.data);
}

async function testUpdateHackathon() {
    console.log("\n--- Update Hackathon ---\n");

    const asAdmin = await request(`http://localhost:3000/hackathons/${createdHackathonId}`, {
        method: "PATCH",
        headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
        body: JSON.stringify({ description: "Updated: now includes a beginner-friendly track." }),
    });
    report("[ADMIN update] (expect 200)", asAdmin.status, asAdmin.data);

    const asParticipant = await request(`http://localhost:3000/hackathons/${createdHackathonId}`, {
        method: "PATCH",
        headers: { "Cookie": signInBetterAuthSessionCookiePariticipant },
        body: JSON.stringify({ description: "Attempted edit by a non-admin participant." }),
    });
    report("[PARTICIPANT update] (expect 403)", asParticipant.status, asParticipant.data);
}

async function testDeleteHackathon() {
    console.log("\n--- Delete Hackathon ---\n");

    const asParticipant = await request(`http://localhost:3000/hackathons/${createdHackathonId}`, {
        method: "DELETE",
        headers: { "Cookie": signInBetterAuthSessionCookiePariticipant },
    });
    report("[PARTICIPANT delete] (expect 403)", asParticipant.status, asParticipant.data);

    const asAdmin = await request(`http://localhost:3000/hackathons/${createdHackathonId}`, {
        method: "DELETE",
        headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
    });
    report("[ADMIN delete] (expect 200)", asAdmin.status, asAdmin.data);

    const confirmGone = await request(`http://localhost:3000/hackathons/${createdHackathonId}`, {
        headers: { "Cookie": signInBetterAuthSessionCookieAdmin },
    });
    report("[ADMIN get deleted] (expect 404)", confirmGone.status, confirmGone.data);
}

const main = async function () {
    // console.log("\n\nTesting Rate Limiter\n\n");
    // await testRateLimiter();

    // console.log("\n\nTesting Better Auth sign-up request\n\n");
    // await testSignUp();

    // console.log("\n\nTesting Better Auth sign-in request\n\n");
    // await testSignIn();

    console.log("\n\nTesting GET request on /users\n\n");
    await testGetUsers();

    console.log("\n\nTesting Hackathon validation errors\n\n");
    await testHackathonValidation();

    console.log("\n\nTesting Hackathon create\n\n");
    await testCreateHackathon();

    console.log("\n\nTesting Hackathon reads\n\n");
    await testGetHackathons();

    console.log("\n\nTesting Hackathon update\n\n");
    await testUpdateHackathon();

    console.log("\n\nTesting Hackathon delete\n\n");
    await testDeleteHackathon();
}();