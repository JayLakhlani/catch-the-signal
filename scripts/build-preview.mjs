import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const html=await readFile(new URL('public/index.html',root),'utf8');
const sources=await Promise.all(['core.js','input.js','app.js'].map(name=>readFile(new URL('public/'+name,root),'utf8')));
const js=sources.map(source=>source.replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'')).join('\n');
const preview=html.replace('data-mode="live"','data-mode="demo"').replace('<script type="module" src="./app.js"></script>','<script type="module">\n'+js+'\n</script>');
await writeFile(new URL('public/preview.html',root),preview);
console.log('Built standalone preview. No responses are sent in preview mode.');
