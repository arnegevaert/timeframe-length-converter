// Check arg count
if (process.argv.length !== 5) {
  console.log('Usage: node timeframe-length-converter.js LENGTH SOURCE DEST');
  console.log('Provide length in minutes');
}

// Check SOURCE readable and DEST writable

// While there is SOURCE data:

//    Read LENGTH minutes of SOURCE data

//    Determine filename of DEST file

//    Serialize data to DEST
