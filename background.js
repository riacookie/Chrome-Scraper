chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "download") {
        request.images.forEach((image) => {
            const filename = `Scrapped_Images/${image.src.split("/").pop()}`;
            const cleanFilename = filename.replace(/[<>:"/\\|?*]+/g, "_");

            chrome.downloads.download(
                {
                    url: image.src,
                    filename: cleanFilename,
                },
                (downloadId) => {
                    if (chrome.runtime.lastError) {
                        console.error(
                            `Download failed: ${chrome.runtime.lastError.message}`
                        );
                    } else {
                        console.log(`Download started: ${downloadId}`);
                    }
                }
            );
        });
    }
});

chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script installed and ready");
});
