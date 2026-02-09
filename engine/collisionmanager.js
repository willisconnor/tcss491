class CollisionManager {
            constructor() {
                this.colliders = [];
                this.scale = 4;
            }

    loadFromTiledJSON(json) {
        // clear old colliders
        this.colliders = [];

        const collisionLayer = json.layers.find(layer => layer.name === "collisions");
        if (!collisionLayer) return;

        for (const obj of collisionLayer.objects) {
            const x = obj.x * this.scale;
            const y = obj.y * this.scale;
            const width = obj.width * this.scale;
            const height = obj.height * this.scale;

            if (obj.ellipse) {
                this.colliders.push({ type: 'ellipse', x, y, width, height });
            } else if (obj.polygon) {
                const scaledPoints = obj.polygon.map(p => ({
                    x: p.x * this.scale,
                    y: p.y * this.scale
                }));
                this.colliders.push({ type: 'polygon', x, y, points: scaledPoints });
            } else {
                this.colliders.push({ type: 'rect', x, y, width, height });
            }
        }
    }

            checkCollision(entityX, entityY, entityWidth, entityHeight) {
                for (const col of this.colliders) {
                    if (col.type === 'rect') {
                        if (this.rectIntersect(entityX, entityY, entityWidth, entityHeight, col.x, col.y, col.width, col.height)) {
                            return true;
                        }
                    } else if (col.type === 'ellipse') {
                        if (this.ellipseRectIntersect(entityX, entityY, entityWidth, entityHeight, col)) {
                            return true;
                        }
                    } else if (col.type === 'polygon') {
                        if (this.polygonRectIntersect(entityX, entityY, entityWidth, entityHeight, col)) {
                            return true;
                        }
                    }
                }
                return false;
            }

            rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
                return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
            }

            ellipseRectIntersect(rx, ry, rw, rh, ellipse) {
                // ellipse center and radii
                const cx = ellipse.x + ellipse.width / 2;
                const cy = ellipse.y + ellipse.height / 2;
                const radiusX = ellipse.width / 2;
                const radiusY = ellipse.height / 2;

                // find closest point on rectangle to ellipse center
                const closestX = Math.max(rx, Math.min(cx, rx + rw));
                const closestY = Math.max(ry, Math.min(cy, ry + rh));

                // normalize distance by ellipse radii
                const dx = (closestX - cx) / radiusX;
                const dy = (closestY - cy) / radiusY;

                return (dx * dx + dy * dy) <= 1;
            }

            polygonRectIntersect(rx, ry, rw, rh, polygon) {
                // convert polygon points to absolute coordinates
                const points = polygon.points.map(p => ({
                    x: polygon.x + p.x,
                    y: polygon.y + p.y
                }));

                // check if any rect corner is inside polygon
                const corners = [
                    { x: rx, y: ry },
                    { x: rx + rw, y: ry },
                    { x: rx + rw, y: ry + rh },
                    { x: rx, y: ry + rh }
                ];

                for (const corner of corners) {
                    if (this.pointInPolygon(corner.x, corner.y, points)) {
                        return true;
                    }
                }

                // check if any polygon edge intersects rect
                for (let i = 0; i < points.length; i++) {
                    const p1 = points[i];
                    const p2 = points[(i + 1) % points.length];
                    if (this.lineIntersectsRect(p1.x, p1.y, p2.x, p2.y, rx, ry, rw, rh)) {
                        return true;
                    }
                }

                return false;
            }

            pointInPolygon(px, py, polygon) {
                let inside = false;
                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    const xi = polygon[i].x, yi = polygon[i].y;
                    const xj = polygon[j].x, yj = polygon[j].y;
                    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                        inside = !inside;
                    }
                }
                return inside;
            }

            lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
                return this.lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
                       this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
                       this.lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
                       this.lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx, ry);
            }

            lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
                const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
                if (denom === 0) return false;
                const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
                const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
                return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
            }
        }