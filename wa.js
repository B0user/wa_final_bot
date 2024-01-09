const express = require('express');
const cors = require('cors');
const { Client } = require('whatsapp-web.js');
const qrcode = require( 'qrcode-terminal');
const { handleMenu } = require('./wamenu');

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
  await handleMenu(client, message);
});



app.use(express.json());
app.use(cors());

// Function to send a message to a single recipient
async function sendMessage(info) {
    const admin_chatId = `77012927772@c.us`; 
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
  
// API endpoint for getting the lastBotMsg by chatID
app.get('/api/getlastmessages/:phone', async (req, res) => {
  const phone = req.params.phone;

  if (!phone) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    // Find the chat by phone number
    const chat = await client.getChatById(`${phone}@c.us`);
    if (!chat) return res.status(400).json({ error: 'Invalid request parameters' });

    // Fetch the last 10 messages from the chat
    const fetchedMessages = await chat.fetchMessages({ limit:200, fromMe: true });

    // Convert the last 10 messages to the specified JSON format
    const last10Messages = fetchedMessages.map(message => ({
      messageDate: new Date(message.timestamp*1000).toLocaleString(),
      messageText: message.body || '' 
    }));

    return res.json({ last10Messages });
  } catch (error) {
    // console.error('Error fetching last 10 messages:');
    return res.status(400).json({ error: 'Incorrect phone' });
  }
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    client.initialize();
    
  });