// Bundles the game into one self-contained HTML file.
//   node build.js                   -> dist/silver-river.html (open it in any browser)
//   node build.js --artifact <file> -> page body only (for hosts that supply their own <html>/<head>/<body>)
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let html = read('index.html');

html = html.replace(/<link rel="stylesheet" href="(src\/[^"]+)">/g, (m, p) => `<style>\n${read(p)}\n</style>`);
html = html.replace(/<script src="(src\/[^"]+)"><\/script>/g, (m, p) => `<script>\n${read(p).replace(/<\/script/gi, '<\\/script')}\n</script>`);

const args = process.argv.slice(2);
const ai = args.indexOf('--artifact');
if (ai >= 0) {
  const out = args[ai + 1];
  if (!out) throw new Error('--artifact needs an output path');
  const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
  const links = (html.match(/<link [^>]+>/g) || []).join('\n');
  const styles = (html.match(/<style>[\s\S]*?<\/style>/g) || []).join('\n');
  const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
  fs.writeFileSync(out, `${title}\n${links}\n${styles}\n${body.trim()}\n`);
  console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
} else {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  const out = path.join(root, 'dist', 'silver-river.html');
  fs.writeFileSync(out, html);
  console.log('wrote', path.relative(root, out), (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
}
