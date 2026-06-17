const fs = require('fs');
const path = require('path');

const dir = 'd:/FYP/TASKMATE/frontend/src';

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk(dir, (err, results) => {
  if (err) throw err;
  
  results.filter(f => f.endsWith('.js') || f.endsWith('.jsx')).forEach(file => {
    // Skip the api/index.js file itself and main.jsx
    if (file.includes('api\\index.js') || file.includes('api/index.js') || file.includes('main.jsx')) {
      return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("import axios from 'axios';") || content.includes('import axios from "axios";') || content.includes('import axios from "axios"')) {
      
      // Calculate relative path to src/api
      let relativePath = path.relative(path.dirname(file), path.join(dir, 'api'));
      // fix windows separators
      relativePath = relativePath.replace(/\\/g, '/');
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }
      
      console.log(`Fixing ${file}`);
      
      // Replace import
      content = content.replace(/import axios from ['"]axios['"];?/g, `import api from '${relativePath}';`);
      
      // Replace axios.get, axios.post, etc.
      content = content.replace(/axios\./g, 'api.');
      content = content.replace(/axios\(/g, 'api(');
      
      fs.writeFileSync(file, content, 'utf8');
    }
  });
});
