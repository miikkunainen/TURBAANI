const fs=require('node:fs'),path=require('node:path');
const file=path.join(__dirname,'public/game.html');let html=fs.readFileSync(file,'utf8');if(!html.includes('src="/net.js"'))html=html.replace('</body>','<script src="/net.js"></script>\n</body>');
html=html.replace('<title>Purjehdus — Double Diamond -peli</title>','<title>Purjehdus verkossa — Turbiini</title>');fs.writeFileSync(file,html,'utf8');console.log('Verkkosovitin liitetty Purjehdus 3 -peliin.');
