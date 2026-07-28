// Run: node server.js
// To send email: set GMAIL_APP_PASSWORD before running. The academy Gmail is the sender.
// Optional: set ADMIN_EMAIL to receive a copy of every registration.
const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const root = __dirname;
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png'};
const jsonFile = path.join(root, 'registrations.json');

function readRecords() { return fs.existsSync(jsonFile) ? JSON.parse(fs.readFileSync(jsonFile, 'utf8')) : []; }
function csvValue(value) { return `"${String(value || '').replace(/"/g, '""')}"`; }
function writeRecords(records) {
  fs.writeFileSync(jsonFile, JSON.stringify(records, null, 2));
  const fields = ['registrationNumber','submittedAt','name','dob','guardian','phone','email','role','battingHand','bowlingHand','address','utr'];
  const csv = [fields.join(','), ...records.map(row => fields.map(key => csvValue(row[key])).join(','))].join('\n');
  fs.writeFileSync(path.join(root, 'registrations.csv'), csv);
}
async function sendEmail(to, subject, html) {
  if (!process.env.GMAIL_APP_PASSWORD) return false;
  const recipients = process.env.ADMIN_EMAIL ? [to, process.env.ADMIN_EMAIL] : [to];
  const transport = nodemailer.createTransport({service:'gmail', auth:{user:'c15inspirationrajucc@gmail.com', pass:process.env.GMAIL_APP_PASSWORD}});
  await transport.sendMail({from:'C15 Inspiration Cricket Club <c15inspirationrajucc@gmail.com>', to:recipients, subject, html});
  return true;
}

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/admin/registrations') {
    const password = req.headers['x-admin-password'];
    if (password !== (process.env.ADMIN_PASSWORD || 'C15Admin2026')) { res.writeHead(401); return res.end(); }
    res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify(readRecords()));
  }
  if (req.method === 'POST' && req.url === '/api/registrations') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        if (!data.name || !data.email || !data.utr) throw new Error('Missing required data');
        const records = readRecords();
        const registrationNumber = `C15-2026-${String(records.length + 1).padStart(4, '0')}`;
        const entry = {...data, registrationNumber, submittedAt: new Date().toISOString()};
        records.push(entry); writeRecords(records);
        const emailSent = await sendEmail(data.email, `C15 Trials Registration Confirmed — ${registrationNumber}`, `<h2>Registration completed!</h2><p>Dear ${data.name},</p><p>Your C15 Inspiration Cricket Club trial registration has been received.</p><p><b>Registration Number: ${registrationNumber}</b></p><p>Trial dates: 12–14 August 2026<br>Reporting time: 8:30 AM onwards<br>Venue: Santragachi BNR Ground</p><p><b>Important:</b> Bring this registration email or a screenshot/printout of it as proof on the trial day.</p><p>Keep this email and registration number for your records.</p>`);
        res.writeHead(201, {'Content-Type':'application/json'}); res.end(JSON.stringify({ok:true, registrationNumber, emailSent}));
      } catch (error) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({ok:false})); }
    }); return;
  }
  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const file = path.join(root, path.normalize(requestPath));
  if (!file.startsWith(root) || !fs.existsSync(file) || !mime[path.extname(file)]) {res.writeHead(404); return res.end('Not found');}
  res.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
}).listen(3000, () => console.log('Open http://localhost:3000'));
