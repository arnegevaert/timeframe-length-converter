const fs = require('fs');
const N3 = require('n3');
const moment = require('moment');
const util = require('./util.js');

args = util.process_args(process.argv);
const length = args.length;
const source = args.source;
const dest = args.dest;

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
      let ts = moment(util.get_timestamp_from_literal(t.object)).unix();
      if (start === -1) {
        let rest = ts % (length * 60);
        start = ts - rest;
        generatedAt.buffer.push(t);
        util.get_triples_for_timestamp(t.object, measurements.file).forEach(t => {
          measurements.buffer.push(t);
        });
      } else if (ts - start < length*60) {
        generatedAt.buffer.push(t);
        util.get_triples_for_timestamp(t.object, measurements.file).forEach(t => {
          measurements.buffer.push(t);
        });
      } else {
        reachedBorder = true;
        generatedAt.overflow.push(t);
        util.get_triples_for_timestamp(t.object, measurements.file).forEach(t => {
          measurements.overflow.push(t);
        });
      }
    });

    if (reachedBorder) {
      let out_filename = start.toString();
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
