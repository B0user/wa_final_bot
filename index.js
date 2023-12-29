
import qrcode from 'qrcode-terminal';
import express from 'express';
import bodyParser from 'body-parser';
import { Client } from 'whatsapp-web.js';

import routes from "./routes/routes.js";

export const client = new Client({
    puppeteer: {
        args: ['--no-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Define API routes
app.use("/api", routes);



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});