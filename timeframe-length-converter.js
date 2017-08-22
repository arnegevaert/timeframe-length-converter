const fs = require('fs');

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

  filenames.forEach((filename) => {
    // TODO
  });
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
