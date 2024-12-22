const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const writeFile = util.promisify(fs.writeFile);

async function generateStructure(folderPath, indent = '', isLast = true) {
  const name = path.basename(folderPath);
  let structure = '';

  // Add the current folder/file to the structure
  const prefix = indent + (isLast ? '└── ' : '├── ');
  structure += prefix + name;

  try {
    const stats = await stat(folderPath);

    if (stats.isDirectory()) {
      const items = await readdir(folderPath);
      const filteredItems = items.filter((item) => !item.startsWith('.') && item !== 'node_modules');

      for (let i = 0; i < filteredItems.length; i++) {
        const item = filteredItems[i];
        const itemPath = path.join(folderPath, item);
        const itemStats = await stat(itemPath);

        structure += '\n';

        const newIndent = indent + (isLast ? '    ' : '│   ');

        // Recursively process subdirectories
        if (itemStats.isDirectory() || itemStats.isFile()) {
          structure += await generateStructure(
            itemPath,
            newIndent,
            i === filteredItems.length - 1
          );
        }
      }
    }

    return structure;
  } catch (error) {
    console.error(`Error processing ${folderPath}:`, error);
    return structure + '\n';
  }
}

async function generate(folderPath) {
  try {
    const fullPath = path.resolve(folderPath);

    const structure = await generateStructure(fullPath);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = `${timestamp}-structure.md`;

    const output = '```\n' + structure + '\n```\n';
    await writeFile(outputFile, output);

    console.log(`Folder structure has been saved to ${outputFile}`);
  } catch (error) {
    console.error('Error generating folder structure:', error);
  }
}

generate(path.join(__dirname, 'src'));
