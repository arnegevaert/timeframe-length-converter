const fs = require('fs');
const N3 = require('n3');
const moment = require('moment');

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

  let start = -1;
  let generatedAt = {file: [], buffer: [], overflow: []};
  let measurements = {file: [], buffer: [], overflow: []};
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const raw = fs.readFileSync(source + filename, "utf8");
    const triples = parser.parse(raw);

    triples.forEach(t => {
      if (t.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
        generatedAt.file.push(t);
      } else {
        measurements.file.push(t);
      }
    });

    let reachedBorder = false;
    generatedAt.file.forEach(t => {
      let ts = moment(get_timestamp_from_literal(t.object)).unix();
      if (start === -1) {
        start = ts;
        generatedAt.buffer.push(t);
        get_triples_for_timestamp(t.object, measurements.file).forEach(t => {
          measurements.buffer.push(t);
        });
      } else if (ts - start < length*60) {
        generatedAt.buffer.push(t);
        get_triples_for_timestamp(t.object, measurements.file).forEach(t => {
          measurements.buffer.push(t);
        });
      } else {
        reachedBorder = true;
        generatedAt.overflow.push(t);
        get_triples_for_timestamp(t.object, measurements.file).forEach(t => {
          measurements.overflow.push(t);
        });
      }
    });

    if (reachedBorder) {
      let i_out_filename = -1;
      generatedAt.buffer.forEach(t => {
        let ts = moment(get_timestamp_from_literal(t.object)).unix();
        if (i_out_filename === -1 || i_out_filename > ts) i_out_filename = ts;
      });
      let out_filename = dest + i_out_filename.toString();
      console.log(out_filename);
      console.log('===============');
      measurements.buffer.forEach(t => console.log(t.graph, t.subject, t.predicate, t.object));
      console.log();

      // Serialize buffers to file

      // Re-initialize buffers with overflow buffer content
      generatedAt.file = generatedAt.overflow;
      measurements.file = measurements.overflow;
      generatedAt.buffer = [];
      measurements.buffer = [];
      generatedAt.overflow = [];
      measurements.overflow = [];

      console.log('overflow: generatedAt');
      console.log('=====================');
      generatedAt.file.forEach(t => console.log(t.graph, t.subject, t.predicate, t.object));
      console.log('overflow: measurements');
      console.log('======================');
      measurements.file.forEach(t => console.log(t.graph, t.subject, t.predicate, t.object));
      console.log();

      start = -1;
    } else {
      generatedAt.file = [];
      measurements.file = [];
    }
  }
}

function get_triples_for_timestamp(literal, triples) {
  const ts = get_timestamp_from_literal(literal);
  const result = [];
  triples.forEach(t => {
    if (get_timestamp_from_graph(t.graph) === ts) {
      result.push(t);
    }
  });
  return result;
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
