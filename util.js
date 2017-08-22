const fs = require('fs');

exports.get_triples_for_timestamp = function(literal, triples) {
  const ts = this.get_timestamp_from_literal(literal);
  const result = [];
  triples.forEach(t => {
    if (this.get_timestamp_from_graph(t.graph) === ts) {
      result.push(t);
    }
  });
  return result;
}

exports.get_timestamp_from_graph = function(graph) {
  return graph.substring(graph.length-19, graph.length);
}

exports.get_timestamp_from_literal = function(literal) {
  return literal.substring(1, 20);
}

exports.process_args = function(argv) {
  if (argv.length !== 5) {
    console.log('Usage: node timeframe-length-converter.js LENGTH SOURCE DEST');
    console.log('Provide length in minutes');
  }

  const length = argv[2];
  const source = argv[3];
  const dest = argv[4];

  fs.stat(source, (err, stats) => {
    if (err) {
      console.error('Directory does not exist: ' + source);
      process.exit(1);
    }
    if (!stats.isDirectory) {
      console.error(source + ' is not a directory');
      process.exit(1);
    }
  });

  fs.access(dest, fs.W_OK, (err) => {
    if(err){
      console.error(dest + ' is not a writable directory');
      process.exit(1);
    }
  });
  return {length, source, dest};
}
