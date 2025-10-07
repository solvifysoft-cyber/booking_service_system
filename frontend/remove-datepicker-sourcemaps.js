const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'node_modules', 'react-datepicker', 'dist');
if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.js')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      // Remove sourceMappingURL lines
      content = content.replace(/\/\/# sourceMappingURL=.*\n?/g, '');
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
}