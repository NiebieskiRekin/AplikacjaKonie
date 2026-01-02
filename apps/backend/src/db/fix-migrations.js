const fs = require("node:fs/promises");
const path = require("node:path");

const MIGRATIONS_DIR = "./src/db/migrations/";

async function main() {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter((file) => file.endsWith(".sql"));

    if (sqlFiles.length === 0) {
      console.log("No SQL files found.");
      return;
    }

    console.log(`Found ${sqlFiles.length} SQL files. Processing...`);

    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const content = await fs.readFile(filePath, "utf-8");
      if (content.includes('"public".')) {
        const fixedContent = content.replace(/"public"\./g, "");
        await fs.writeFile(filePath, fixedContent, "utf-8");
        console.log(`Fixed: ${file}`);
      }
    }
    console.log("Migration fix complete.");
  } catch (error) {
    console.error("Error fixing migrations:", error);
    process.exit(1);
  }
}

main();
