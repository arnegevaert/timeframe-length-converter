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

  let start = -1;
  let generatedAt = {file: [], buffer: [], overflow: []};
  let measurements = {file: [], buffer: [], overflow: []};
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    start = process_file(filename, generatedAt, measurements, start, false);
  }
}

function process_file(filename, generatedAt, measurements, start, recursive, triples) {
  const parser = N3.Parser();
  const raw = fs.readFileSync(source + filename, "utf8");
  if (triples === undefined) {
    console.log('parsing...');
    triples = parser.parse(raw);
  }

  if (!recursive) {
    console.log('splitting...');
    triples.forEach(t => {
      if (t.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
        generatedAt.file.push(t);
      } else {
        measurements.file.push(t);
      }
    });
  }

  let reachedBorder = false;
  let counter = 0;
  //generatedAt.file.forEach(t => {
  let index = 0;
  console.log('Traversing generatedAt...', generatedAt.file.length);
  while(!reachedBorder && index < generatedAt.file.length) {
    let t = generatedAt.file[index];
    let ts = moment(util.get_timestamp_from_literal(t.object)).unix();
    counter++;
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
    }
    index++;
  }
  //});

  if (reachedBorder) {
    console.log('filtering...');
    generatedAt.overflow = generatedAt.file.filter(x => generatedAt.buffer.indexOf(x) === -1);
    measurements.overflow = measurements.file.filter(x => measurements.buffer.indexOf(x) === -1);
    console.log('writing...');
    let out_filename = start.toString();
    let writer = N3.Writer();
    writer.addTriples(measurements.buffer);
    writer.addTriples(generatedAt.buffer);
    writer.end((error, result) => fs.writeFileSync(dest + out_filename, result));

    // Re-initialize buffers with overflow buffer content
    generatedAt.file = generatedAt.overflow;
    measurements.file = measurements.overflow;
    generatedAt.buffer = [];
    measurements.buffer = [];
    generatedAt.overflow = [];
    measurements.overflow = [];
    start = -1;
    if (generatedAt.file.length !== 0) {
      process_file(filename, generatedAt, measurements, start, true, triples);
    }
  } else {
    generatedAt.file = [];
    measurements.file = [];
  }
  return start;
}
