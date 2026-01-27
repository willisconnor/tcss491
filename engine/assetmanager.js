class AssetManager {
    constructor() {
        this.successCount = 0;
        this.errorCount = 0;
        this.cache = [];
        this.downloadQueue = [];
    };

    queueDownload(path) {
        console.log("Queueing " + path);
        this.downloadQueue.push(path);
    };

    isDone() {
        return this.downloadQueue.length === this.successCount + this.errorCount;
    };

    downloadAll(callback) {
        if (this.downloadQueue.length === 0) setTimeout(callback, 10);
        for (let i = 0; i < this.downloadQueue.length; i++) {
            const path = this.downloadQueue[i];
            console.log(path);

            // Checking if file is json or png
            const extension = path.split('.').pop();

            if (extension === 'json') {
                fetch(path)
                    .then(response => response.json())
                    .then(json => {
                        console.log("Loaded " + path);
                        this.cache[path] = json;
                        this.successCount++;
                        if (this.isDone()) callback();
                    })
                    .catch(() => {
                        console.log("Error loading " + path);
                        this.errorCount++;
                        if (this.isDone()) callback();
                    });
            } else {
                // image loading
                const img = new Image();
                img.addEventListener("load", () => {
                    console.log("Loaded " + img.src);
                    this.successCount++;
                    if (this.isDone()) callback();
                });

                img.addEventListener("error", () => {
                    console.log("Error loading " + img.src);
                    this.errorCount++;
                    if (this.isDone()) callback();
                });

                img.src = path;
                this.cache[path] = img;
            }
        }
    };

    getAsset(path) {
        return this.cache[path];
    }
}