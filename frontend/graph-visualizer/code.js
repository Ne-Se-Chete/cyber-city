window.onload = function () {
    var x = new Graph();
    // Add nodes with positions
    x.addNode("a", {color: "red"});
    x.addNode("b", { color: "blue" });
    x.addNode("c", { color: "gray" });
    x.addNode("d", { color: "yellow" });

    // Now add edges between nodes
    x.addEdge("a", "b");
    x.addEdge("c", "d");
    x.addEdge("b", "d");

    aStar(x, x.nodes["a"], x.nodes["d"], function (a, b) {
        return 1;
    });

    start_node = x.nodes["d"];
    while (start_node.predecessor) {
        start_node.stroke_width = 4;
        start_node = start_node.predecessor;
    }
    start_node.stroke_width = 4;

    // Skip the layout calculation to keep the positions fixed
    layouter = new Graph.Layout.Spring(x);
    layouter.layout(); // Don't call layout

    // Draw the graph using the RaphaelJS render implementation
    var renderer = new Graph.Renderer.Raphael('paper', x, 600, 400);
    renderer.draw();
};
