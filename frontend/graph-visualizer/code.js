window.onload = function () {
    var x = new Graph();

    // Add nodes with positions
    x.addNode("a", {brr: "brr", x: 100, y: 100});
    x.addNode("b");
    x.addNode("c");
    x.addNode("d");

    // Now add edges between nodes
    x.addEdge("a", "b");
    x.addEdge("a", "c");
    x.addEdge("c", "d");
    x.addEdge("b", "d");

    aStar(x, x.nodes["a"], x.nodes["d"], function (a, b) {
        return 1;
    });

    // Skip the layout calculation to keep the positions fixed
    layouter = new Graph.Layout.Spring(x);
    layouter.layout(); // Don't call layout

    // Draw the graph using the RaphaelJS render implementation
    var renderer = new Graph.Renderer.Raphael('paper', x, 600, 400);
    renderer.draw();
};
