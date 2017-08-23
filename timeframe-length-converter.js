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

  let config = {
    start: -1,
    generatedAt: {triples: [], index: 0},
    measurements: {triples: [], index: 0},
    triples: [],
    recursive: false
  };
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    config.recursive = false;
    process_file(filename, config);
  }
}

function process_file(filename, config) {
  const parser = N3.Parser();
  const raw = fs.readFileSync(source + filename, "utf8");

  if (!config.recursive) {
    config.triples = parser.parse(raw);
    config.triples.forEach(t => {
      if (t.predicate === 'http://www.w3.org/ns/prov#generatedAtTime') {
        config.generatedAt.triples.push(t);
      } else {
        config.measurements.triples.push(t);
      }
    });
  }

  let reachedBorder = false;
  while(!reachedBorder && config.generatedAt.index < config.generatedAt.triples.length) {
    let t = config.generatedAt.triples[config.generatedAt.index];
    let ts = moment(util.get_timestamp_from_literal(t.object)).unix();
    if (config.start === -1 || ts - config.start < length*60) {
      if (config.start === -1) {
        let rest = ts % (length * 60);
        config.start = ts - rest;
      }
      let added = false;
      let meas = config.measurements.triples[config.measurements.index];
      while(meas !== undefined && (meas.predicate === 'rdf:type' || meas.predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' || moment(util.get_timestamp_from_graph(meas.graph)).unix() <= ts)) {
        config.measurements.index++;
        meas = config.measurements.triples[config.measurements.index];
        added = true;
      }
      config.generatedAt.index++;
    } else {
      reachedBorder = true;
    }
  }

  if (reachedBorder) {
    let out_filename = config.start.toString();
    let writer = N3.Writer();
    let writeMeas = config.measurements.triples.splice(0, config.measurements.index);
    let writeGenAt = config.generatedAt.triples.splice(0, config.generatedAt.index);
    writer.addTriples(writeGenAt);
    writer.addTriples(writeMeas);
    writer.end((error, result) => fs.writeFileSync(dest + out_filename, result));

    config.generatedAt.index = 0;
    config.measurements.index = 0;
    config.start = -1;
    if (config.generatedAt.triples.length !== 0) {
      config.recursive = true;
      process_file(filename, config);
    }
  }
}
