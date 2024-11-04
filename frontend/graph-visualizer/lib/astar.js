// A* Algorithm Implementation
function aStar(g, start, goal, heuristic) {
    // Initialize nodes
    for (let n in g.nodes) {
        g.nodes[n].g = Infinity;
        g.nodes[n].h = 0;
        g.nodes[n].f = Infinity;
        g.nodes[n].predecessor = null;
        g.nodes[n].optimized = false;
    }

    start.g = 0;
    start.h = heuristic(start, goal);
    start.f = start.g + start.h;

    let openSet = new BinaryMinHeap(Object.values(g.nodes), 'f');
    openSet.insert(start);
    let node;

    while (openSet.min() !== undefined) {
        node = openSet.extractMin();
        node.optimized = true;

        if (node === goal) {
            return reconstructPath(goal);
        }

        node.edges.forEach(function (edge) {
            let neighbor = (node === edge.source) ? edge.target : edge.source;

            if (neighbor.optimized) {
                return;
            }

            let tentativeG = node.g + edge.weight;

            if (tentativeG < neighbor.g) {
                neighbor.predecessor = node;
                neighbor.g = tentativeG;
                neighbor.h = heuristic(neighbor, goal);
                neighbor.f = neighbor.g + neighbor.h;

                // Instead of checking if it exists, we just insert it again
                openSet.insert(neighbor);
            }
        });
    }

    return []; // No path found
}

// Function to reconstruct the path from start to goal
function reconstructPath(goal) {
    let path = [];
    let current = goal;

    while (current) {
        path.push(current);
        current = current.predecessor;
    }

    return path.reverse();
}

// Binary Min Heap Class Implementation
class BinaryMinHeap {
    constructor(array = [], key = 'key') {
        this.tree = [];
        this.key = key;

        const parent = (index) => Math.floor((index - 1) / 2);
        const left = (index) => 2 * index + 1;
        const right = (index) => 2 * index + 2;

        const bubbleUp = (i) => {
            let p = parent(i);
            while (p >= 0 && this.tree[i][this.key] < this.tree[p][this.key]) {
                [this.tree[i], this.tree[p]] = [this.tree[p], this.tree[i]];
                i = p;
                p = parent(i);
            }
        };

        const bubbleDown = (i) => {
            let l = left(i);
            let r = right(i);
            while ((this.tree[l] && this.tree[i][this.key] > this.tree[l][this.key]) ||
                   (this.tree[r] && this.tree[i][this.key] > this.tree[r][this.key])) {
                let child = (this.tree[r] && this.tree[l][this.key] > this.tree[r][this.key]) ? r : l;
                [this.tree[i], this.tree[child]] = [this.tree[child], this.tree[i]];
                i = child;
                l = left(i);
                r = right(i);
            }
        };

        this.insert = (element) => {
            if (element[this.key] === undefined) {
                element = { [this.key]: element };
            }
            this.tree.push(element);
            bubbleUp(this.tree.length - 1);
        };

        this.min = () => this.tree.length === 0 ? undefined : this.tree[0];

        this.extractMin = () => {
            if (this.tree.length === 0) return undefined;
            const result = this.min();
            if (this.tree.length === 1) {
                this.tree = [];
            } else {
                this.tree[0] = this.tree.pop();
                bubbleDown(0);
            }
            return result;
        };

        this.heapify = () => {
            for (let start = Math.floor((this.tree.length - 2) / 2); start >= 0; start--) {
                bubbleDown(start);
            }
        };

        for (const item of array) {
            this.insert(item);
        }
    }
}

// Example Heuristic Function
function heuristic(node, goal) {
    // Example heuristic, can be replaced with a more specific function
    return Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y); // Manhattan distance
}
