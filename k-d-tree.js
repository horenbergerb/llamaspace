class KDNode {
    constructor(point, axis) {
        this.point = point;  // [x, y]
        this.axis = axis;    // 0 for x, 1 for y
        this.left = null;
        this.right = null;
    }
}

export class KDTree {
    constructor(points, depth = 0) {
        if (points.length === 0) {
            this.root = null;
            return;
        }
        this.root = this.buildTree(points, depth);
    }

    buildTree(points, depth) {
        if (points.length === 0) return null;

        const axis = depth % 2; // 0 for x-axis, 1 for y-axis
        points.sort((a, b) => a.getCoords()[axis] - b.getCoords()[axis]); // Sort by current axis
        const median = Math.floor(points.length / 2);

        const node = new KDNode(points[median], axis);
        node.left = this.buildTree(points.slice(0, median), depth + 1);
        node.right = this.buildTree(points.slice(median + 1), depth + 1);

        return node;
    }

    nearestNeighbor(target, best = null, bestDist = Infinity, node = this.root) {
        if (!node) return best;

        const dist = this.squaredDistance(target, node.point.getCoords());
        if (dist < bestDist) {
            best = node.point;
            bestDist = dist;
        }

        const axis = node.axis;
        const nextBranch = target[axis] < node.point.getCoords()[axis] ? node.left : node.right;
        const oppositeBranch = target[axis] < node.point.getCoords()[axis] ? node.right : node.left;

        best = this.nearestNeighbor(target, best, bestDist, nextBranch);
        bestDist = this.squaredDistance(target, best.getCoords());

        // Check if we need to search the opposite branch
        if (Math.abs(target[axis] - node.point.getCoords()[axis]) ** 2 < bestDist) {
            best = this.nearestNeighbor(target, best, bestDist, oppositeBranch);
        }

        return best;
    }

    kNearestNeighbors(target, k, node = this.root, queue = []) {
        if (!node) return queue;

        const dist = this.squaredDistance(target, node.point.getCoords());
        this.priorityQueuePush(queue, node.point, dist, k);

        const axis = node.axis;
        const nextBranch = target[axis] < node.point.getCoords()[axis] ? node.left : node.right;
        const oppositeBranch = target[axis] < node.point.getCoords()[axis] ? node.right : node.left;

        queue = this.kNearestNeighbors(target, k, nextBranch, queue);

        if (queue.length < k || Math.abs(target[axis] - node.point.getCoords()[axis]) ** 2 < queue[queue.length - 1].dist) {
            queue = this.kNearestNeighbors(target, k, oppositeBranch, queue);
        }

        return queue.map(entry => entry.point);
    }

    squaredDistance(a, b) {
        return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
    }

    priorityQueuePush(queue, point, dist, k) {
        queue.push({ point, dist });
        queue.sort((a, b) => a.dist - b.dist);
        if (queue.length > k) queue.pop();
    }
}