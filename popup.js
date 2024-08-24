document.getElementById("scrape").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
            const currentTab = tabs[0];

            const validUrlPattern = /^(http|https):\/\//;
            if (!validUrlPattern.test(currentTab.url)) {
                console.error("Cannot run script on this URL");
                alert("Cannot run script on this URL");
                return;
            }

            chrome.scripting.executeScript(
                {
                    target: { tabId: currentTab.id },
                    files: ["content.js"],
                },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            `Script injection failed: ${chrome.runtime.lastError.message}`
                        );
                    } else {
                        chrome.tabs.sendMessage(
                            currentTab.id,
                            { action: "scrape" },
                            (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error(
                                        `Error: ${chrome.runtime.lastError.message}`
                                    );
                                } else if (response.status === "error") {
                                    console.error(
                                        `Scrape error: ${response.message}`
                                    );
                                } else {
                                    console.log(
                                        "Scrape command sent:",
                                        response
                                    );
                                }
                            }
                        );
                    }
                }
            );
        } else {
            console.error("No active tab found");
        }
    });
});
