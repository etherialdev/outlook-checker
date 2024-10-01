const readline = require('readline');
const fs = require('fs');

function remove_line(file_path, line_to_remove) {
    fs.readFile(file_path, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        const lines = data.split('\n');
        const newLines = lines.filter(line => line.trim() !== line_to_remove);
        fs.writeFile(file_path, newLines.join('\n'), 'utf8', (err) => {
            //
        });
    });
}

function prompt_user(question) {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
  
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
}

module.exports = { remove_line, prompt_user };
  