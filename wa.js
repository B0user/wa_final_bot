const express = require('express');
const cors = require('cors');
const { Client } = require('whatsapp-web.js');
const qrcode = require( 'qrcode-terminal');


const app = express();
const port = 9990;

const client = new Client({
  puppeteer: {
    args: ['--no-sandbox'],
  },
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client is ready!');
});


client.on('message', async message => {
    const senderId = message.from;
    const msgContent = message.body.toLowerCase().trim();
    const chat = await message.getChat();

    const fetchedMessageFromBot = await chat.fetchMessages({"limit": 1, "fromMe": true})

    console.log(fetchedMessageFromBot[0]);
    console.log(fetchedMessageFromBot[0].body.toLowerCase());
    console.log(msgContent);
});



app.use(express.json());
app.use(cors());

// Function to send a message to a single recipient
async function sendMessage(info) {
    const admin_chatId = `77028579133@c.us`; 
    const chatId = `${info.phone}@c.us`; // WhatsApp ID format
  
    try {
      await client.sendMessage(chatId, info.text);
      await client.sendMessage(admin_chatId, info.success)
      console.log(`Message sent to ${info.phone}`);
      return true; // Return true if the message is sent
    } catch (error) {
      await client.sendMessage(admin_chatId, info.error)
      return false; // Return false in case of an error
    }
  }



  // API endpoint for sending a message to a single recipient
app.post('/api/sendone', async (req, res) => {
    const info = req.body;
  
    if (!info || !info.phone || !info.text || !info.success || !info.error) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
  
    const result = await sendMessage(info);
  
    if (result) {
      return res.json({ success: 'Message sent successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  });
  



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    client.initialize();
    
  });