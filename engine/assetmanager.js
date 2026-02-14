class AssetManager {
    constructor() {
        this.successCount = 0;
        this.errorCount = 0;
        this.cache = [];
        this.downloadQueue = [];
    }

    queueDownload(path) {
        console.log("Queueing " + path);
        this.downloadQueue.push(path);
    }

    isDone() {
        return this.downloadQueue.length === this.successCount + this.errorCount;
    }

    downloadAll(callback) {
        if (this.downloadQueue.length === 0) setTimeout(callback, 10);

        for (let i = 0; i < this.downloadQueue.length; i++) {
            const path = this.downloadQueue[i];
            const ext = path.substring(path.lastIndexOf('.'));

            switch (ext) {
                case '.jpg':
                case '.png':
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
                    break;

                case '.wav':
                case '.mp3':
                case '.mp4':
                    const aud = new Audio();
                    aud.addEventListener("loadeddata", () => {
                        console.log("Loaded " + aud.src);
                        this.successCount++;
                        if (this.isDone()) callback();
                    });

                    aud.addEventListener("error", () => {
                        console.log("Error loading " + aud.src);
                        this.errorCount++;
                        if (this.isDone()) callback();
                    });

                    aud.addEventListener("ended", () => {
                        aud.pause();
                        aud.currentTime = 0;
                    });

                    aud.src = path;
                    aud.load();

                    this.cache[path] = aud;
                    break;

                case '.json':
                    fetch(path).then(response => response.json()).then(json => {
                        console.log("Loaded " + path);
                        this.cache[path] = json;
                        this.successCount++;
                        if (this.isDone()) callback();
                    }).catch(e => {
                        console.log("Error loading " + path, e); // now e is used to get rid of warning
                        this.errorCount++;
                        if (this.isDone()) callback();
                    });
                    break;
            }
        }
    }

    getAsset(path) {
        return this.cache[path];
    }

    playAsset(path) {
        let audio = this.cache[path];
        if (audio) {
            let temp = audio.cloneNode();
            temp.volume = 0.5;
            temp.play().catch(e => console.error(e));
            return temp; // added line to allow tracking
        }
        return null;
    }

    muteAll(mute) {
        for (var key in this.cache) {
            let asset = this.cache[key];
            if (asset instanceof Audio) {
                asset.muted = mute;
            }
        }
    }
}