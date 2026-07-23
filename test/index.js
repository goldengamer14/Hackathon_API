async function testRateLimiter() {
    for (let i = 0; i < 60; ++i) {
        await fetch('http://localhost:3000', {
            method: "GET",
            headers: {
                "Content-Type": "application/text"
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

const main = async function () {
    console.log("\n\nTesting rate limiter. Sending 600 requests to http://localhost:3000\n\n");
    await testRateLimiter();
}();
