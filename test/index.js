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
}

async function testSignIn() {
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
    .then(res => res.json())
    .then(data => console.log("Sign-in response:", data))
    .catch(err => console.error(err));
}

const main = async function () {
    // console.log("\n\nTesting Rate Limiter\n\n");
    // await testRateLimiter();

    console.log("\n\nTesting Better Auth sign-up request\n\n");
    await testSignUp();

    console.log("\n\nTesting Better Auth sign-in request\n\n");
    await testSignIn();
}();
