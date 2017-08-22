const fs = require('fs');
const N3 = require('n3');

// Check arg count
if (process.argv.length !== 5) {
  console.log('Usage: node timeframe-length-converter.js LENGTH SOURCE DEST');
  console.log('Provide length in minutes');
}

const length = process.argv[2];
const source = process.argv[3];
const dest = process.argv[4];

check_args();
convert_timeframe_length();

function convert_timeframe_length() {
  const filenames = fs.readdirSync(source).sort();
  const parser = N3.Parser();
  console.log(filenames);
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const raw = fs.readFileSync(source + filename, "utf8");
    const triples = parser.parse(raw);
    const generatedAt = [];
    const measurements = [];
    triples.forEach((t) => {
      if (t.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
        generatedAt.push(t);
        get_triples_for_timestamp(t.object, measurements);
      } else {
        measurements.push(t);
      }
    });
  }
}

function get_triples_for_timestamp(literal, triples) {
  const ts = get_timestamp_from_literal(literal);
  const result = [];
  console.log(literal);
  console.log('======================================================================');
  triples.forEach(t => {
    if (get_timestamp_from_graph(t.graph) === ts) {
      console.log(t.graph);
    }
  });
  console.log();
}

function get_timestamp_from_graph(graph) {
  return graph.substring(graph.length-19, graph.length);
}

function get_timestamp_from_literal(literal) {
  return literal.substring(1, 20);
}

function check_args() {
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
}
