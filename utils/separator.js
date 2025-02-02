const fs = require('fs');
const readline = require('readline');

function read_lines(file) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const readStream = fs.createReadStream(file);
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      lines.push(line);
    });

    rl.on('close', () => {
      resolve(lines);
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

async function get_sections(file, threads) {
  const lines = await read_lines(file);
  
  let numParts = parseInt(threads, 10);

  if (numParts > lines.length) {
    numParts = lines.length;
  }

  const partSize = Math.floor(lines.length / numParts);
  const remainder = lines.length % numParts;

  const parts = [];
  let startIndex = 0;

  for (let i = 0; i < numParts; i++) {
    const currentPartSize = partSize + (i < remainder ? 1 : 0);
    parts.push(lines.slice(startIndex, startIndex + currentPartSize));
    startIndex += currentPartSize;
  }

  const sections = {};
  for (let i = 0; i < parts.length; i++) {
    const sectionId = `section_${i + 1}`;
    sections[sectionId] = parts[i];
  }

  return sections;
}


module.exports = {
    get_sections
}