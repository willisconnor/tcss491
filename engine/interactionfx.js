/**
 * InteractionFX: Sprite accurate silhouette glow + polygon glow + iris transition + shockwave
 *
 * PERFORMANCE: Sprite glow is cached to offscreen canvas, only re-rendered when
 * animation frame changes. Polygon glow uses cheap shadowBlur strokes. Iris
 * transition uses a single composite fill path.
 */
class InteractionFX {
    static shockwaves = [];
    static _glowCache = new Map();

    // cache helper
    static _getCache(cacheKey, width, height) {
        let entry = InteractionFX._glowCache.get(cacheKey);
        if (!entry) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            entry = { canvas, ctx: canvas.getContext('2d'), lastFrame: -1, lastColor: null };
            entry.ctx.imageSmoothingEnabled = false;
            InteractionFX._glowCache.set(cacheKey, entry);
        }
        if (entry.canvas.width !== width || entry.canvas.height !== height) {
            entry.canvas.width = width;
            entry.canvas.height = height;
            entry.lastFrame = -1;
        }
        return entry;
    }

    //  SPRITE GLOW  [Animator based: Stuart, Yorkie, etc.]
    static drawSpriteGlow(ctx, animator, x, y, scale, color = "#ffffff", cacheKey = "default") {
        if (!animator) return;
        const pad = 8;
        const fw = animator.width * scale + pad * 2;
        const fh = animator.height * scale + pad * 2;
        const currentFrame = animator.currentFrame();
        const cache = InteractionFX._getCache("sprite_" + cacheKey, Math.ceil(fw), Math.ceil(fh));

        if (cache.lastFrame !== currentFrame || cache.lastColor !== color) {
            cache.lastFrame = currentFrame;
            cache.lastColor = color;
            const oc = cache.ctx;
            oc.clearRect(0, 0, fw, fh);
            oc.imageSmoothingEnabled = false;

            oc.save();
            oc.globalAlpha = 0.25;
            oc.filter = `brightness(1.8) drop-shadow(0 0 6px ${color})`;
            for (const [ox, oy] of [[-3,0],[3,0],[0,-3],[0,3]]) animator.drawFrame(0, oc, pad+ox, pad+oy, scale);
            oc.restore();

            oc.save();
            oc.globalAlpha = 0.4;
            oc.filter = `brightness(2) drop-shadow(0 0 3px ${color})`;
            for (const [ox, oy] of [[-1,0],[1,0],[0,-1],[0,1]]) animator.drawFrame(0, oc, pad+ox, pad+oy, scale);
            oc.restore();
        }

        const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.45 * pulse;
        ctx.drawImage(cache.canvas, x - pad, y - pad);
        ctx.restore();
    }

    // ── Flipped sprite glow ──
    static drawSpriteGlowFlipped(ctx, animator, x, y, scale, spriteWidth, color = "#ffffff", cacheKey = "default_flip") {
        if (!animator) return;
        const pad = 8;
        const fw = animator.width * scale + pad * 2;
        const fh = animator.height * scale + pad * 2;
        const currentFrame = animator.currentFrame();
        const cache = InteractionFX._getCache("spriteflip_" + cacheKey, Math.ceil(fw), Math.ceil(fh));

        if (cache.lastFrame !== currentFrame || cache.lastColor !== color) {
            cache.lastFrame = currentFrame;
            cache.lastColor = color;
            const oc = cache.ctx;
            oc.clearRect(0, 0, fw, fh);
            oc.imageSmoothingEnabled = false;
            const drawF = (ox, oy) => { oc.save(); oc.translate(pad+ox+animator.width*scale, pad+oy); oc.scale(-1,1); animator.drawFrame(0, oc, 0, 0, scale); oc.restore(); };

            oc.save(); oc.globalAlpha = 0.25; oc.filter = `brightness(1.8) drop-shadow(0 0 6px ${color})`;
            for (const [ox,oy] of [[-3,0],[3,0],[0,-3],[0,3]]) drawF(ox,oy);
            oc.restore();

            oc.save(); oc.globalAlpha = 0.4; oc.filter = `brightness(2) drop-shadow(0 0 3px ${color})`;
            for (const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1]]) drawF(ox,oy);
            oc.restore();
        }

        const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.45 * pulse;
        ctx.drawImage(cache.canvas, x - pad, y - pad);
        ctx.restore();
    }

    //  IMAGE GLOW  [drawImage with source rect: HeartContainer, GoldenKey]
    static drawImageGlow(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh, color = "#ffffff", cacheKey = "img_default") {
        if (!image) return;
        const pad = 8;
        const fw = Math.ceil(dw + pad * 2);
        const fh = Math.ceil(dh + pad * 2);
        const cache = InteractionFX._getCache("img_" + cacheKey, fw, fh);

        if (cache.lastFrame !== Math.round(dw) || cache.lastColor !== color) {
            cache.lastFrame = Math.round(dw);
            cache.lastColor = color;
            const oc = cache.ctx;
            oc.clearRect(0, 0, fw, fh);
            oc.imageSmoothingEnabled = false;

            oc.save(); oc.globalAlpha = 0.25; oc.filter = `brightness(1.8) drop-shadow(0 0 6px ${color})`;
            for (const [ox,oy] of [[-3,0],[3,0],[0,-3],[0,3]]) oc.drawImage(image, sx, sy, sw, sh, pad+ox, pad+oy, dw, dh);
            oc.restore();

            oc.save(); oc.globalAlpha = 0.4; oc.filter = `brightness(2) drop-shadow(0 0 3px ${color})`;
            for (const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1]]) oc.drawImage(image, sx, sy, sw, sh, pad+ox, pad+oy, dw, dh);
            oc.restore();
        }

        const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.4 + 0.45 * pulse;
        ctx.drawImage(cache.canvas, dx - pad, dy - pad);
        ctx.restore();
    }

    //  POLYGON GLOW: for doors & computer from Tiled JSON interactable layers
    //  Points array: [{x, y}, ...] in world-space (already scaled)
    static drawPolygonGlow(ctx, points, color = "#ffffff") {
        if (!points || points.length < 3) return;
        const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.5;

        ctx.save();

        // Outer soft glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 16 * pulse;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.35 * pulse;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.stroke();

        // also fill with very faint color for subtle interior highlight
        ctx.globalAlpha = 0.06 * pulse;
        ctx.fillStyle = color;
        ctx.fill();

        // inner tight rim
        ctx.shadowBlur = 6 * pulse;
        ctx.globalAlpha = 0.55 * pulse;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    static polygonCenter(points) {
        if (!points || points.length === 0) return { x: 0, y: 0 };
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const p of points) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    }

    //  RECT GLOW  (fallback for Safe, Keypad)
    static drawRectGlow(ctx, x, y, w, h, color = "#ffffff") {
        const pulse = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 14 * pulse;
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.45 * pulse;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.shadowBlur = 22 * pulse;
        ctx.globalAlpha = 0.2 * pulse;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
        ctx.restore();
    }

    //  IRIS TRANSITION  (Animal Crossing style)
    static drawIris(ctx, focusX, focusY, progress, canvasW, canvasH) {
        if (progress <= 0) return;

        // Max radius = distance from focus to farthest corner
        const corners = [[0,0],[canvasW,0],[0,canvasH],[canvasW,canvasH]];
        let maxR = 0;
        for (const [cx, cy] of corners) {
            const d = Math.sqrt((focusX - cx) ** 2 + (focusY - cy) ** 2);
            if (d > maxR) maxR = d;
        }

        // Clamp progress and compute radius (1 = closed = radius 0)
        const clamped = Math.max(0, Math.min(1, progress));
        const radius = maxR * (1 - clamped);

        ctx.save();
        ctx.resetTransform();

        // Draw full-screen black with circular hole
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.rect(0, 0, canvasW, canvasH);
        // Counter-clockwise arc creates a "hole" in the rect fill
        ctx.arc(focusX, focusY, Math.max(0, radius), 0, Math.PI * 2, true);
        ctx.fill();

        ctx.restore();
    }


    //  SHOCKWAVE
    static triggerShockwave(centerX, centerY, color = "#ffffff") {
        InteractionFX.shockwaves.push({
            x: centerX, y: centerY, radius: 2, alpha: 1.0, color,
            particles: Array.from({ length: 14 }, () => {
                const angle = Math.random() * Math.PI * 2;
                return { angle, speed: 100 + Math.random() * 200, dist: 0, alpha: 1.0,
                    size: 1.5 + Math.random() * 3, trailLen: 3 + Math.random() * 6 };
            })
        });
    }

    static updateAndDraw(ctx, clockTick) {
        for (let i = InteractionFX.shockwaves.length - 1; i >= 0; i--) {
            const sw = InteractionFX.shockwaves[i];
            sw.radius += 300 * clockTick;
            sw.alpha -= 2.0 * clockTick;
            if (sw.alpha <= 0) { InteractionFX.shockwaves.splice(i, 1); continue; }

            ctx.save();
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 12 * sw.alpha;
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha * 0.85;
            ctx.lineWidth = Math.max(1, 4 * sw.alpha);
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();

            if (sw.radius > 18) {
                ctx.shadowBlur = 5;
                ctx.globalAlpha = sw.alpha * 0.25;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius * 0.5, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.shadowBlur = 4;
            for (const p of sw.particles) {
                p.dist += p.speed * clockTick;
                p.alpha -= 2.2 * clockTick;
                if (p.alpha <= 0) continue;
                const px = sw.x + Math.cos(p.angle) * p.dist;
                const py = sw.y + Math.sin(p.angle) * p.dist;
                const tx = px - Math.cos(p.angle) * p.trailLen;
                const ty = py - Math.sin(p.angle) * p.trailLen;
                ctx.globalAlpha = p.alpha;
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = p.size * p.alpha * 0.5;
                ctx.lineCap = "round";
                ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke();
            }
            ctx.restore();
        }
    }
}