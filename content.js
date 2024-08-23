console.log("Content script loaded");

if (typeof imageHashes === "undefined") {
    var imageHashes = new Map();
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "scrape") {
        let imagesToDownload = [];

        try {
            const images = document.querySelectorAll("img");

            for (const img of images) {
                if (img && img.src) {
                    try {
                        const imgData = await getImageData(img.src);
                        const hash = await generateHash(imgData);

                        const currentResolution = img.width * img.height;

                        if (imageHashes.has(hash)) {
                            const storedImage = imageHashes.get(hash);
                            const storedResolution =
                                storedImage.width * storedImage.height;

                            if (currentResolution > storedResolution) {
                                imageHashes.set(hash, img);
                            }
                        } else {
                            imageHashes.set(hash, img);
                        }
                    } catch (error) {
                        console.warn(
                            `Failed to process image: ${img.src}`,
                            error
                        );
                    }
                }
            }

            imagesToDownload = Array.from(imageHashes.values()).map((img) => ({
                src: img.src,
                width: img.width,
                height: img.height,
            }));

            chrome.runtime.sendMessage(
                { action: "download", images: imagesToDownload },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                    }
                }
            );

            sendResponse({ status: "completed" });
        } catch (error) {
            console.error("Error scraping images:", error);
            sendResponse({ status: "error", message: error.message });
        }

        return true;
    }
});

function getImageData(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;

        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result);
                    };
                    reader.readAsArrayBuffer(blob);
                });
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => {
            reject(new Error("Failed to load image for hashing"));
        };
    });
}

function generateHash(buffer) {
    return crypto.subtle.digest("SHA-256", buffer).then((hash) => {
        return Array.from(new Uint8Array(hash))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    });
}
