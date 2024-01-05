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

    if (chat.isGroup) {
      return;
    }

    const fetchedMessageFromBot = await chat.fetchMessages({"limit": 1, "fromMe": true})

    // console.log(fetchedMessageFromBot[0]);
    // console.log(fetchedMessageFromBot[0]?.body?.toLowerCase());
    // console.log(msgContent);

    const lastBotMsg = fetchedMessageFromBot[0]?.body?.toLowerCase();

    if (lastBotMsg === "здравствуйте! вас рада приветствовать стоматология идеал!\n наш сайт: ideal-stom.kz\n наш инстаграм: @idealstom.krg\n \nс вами на связи робот, просим вас сообщить, что вас интересует: \n 1. запись на лечение зуба/ов\n 2. запись на чистку зубов, лечение десен\n 3. запись на удаление зуба/ов\n 4. запись на консультацию по имплантам\n 5. запись на консультацию по брекетам (исправлению прикуса)\n 6. запись на консультацию по протезированию\n 7. хочу задать вопрос\n 8. прошу перенести мою запись\n 9. прошу отменить мою запись\n\nвведите ответ цифрой от 1 до 9") {
      if (msgContent === "1" ||  msgContent === "2" || msgContent === "3") {
        await client.sendMessage(senderId, 'У Вас есть страховка Медикер (на работе выдавали карту Медикер)? Ответьте "да" или "нет"');
      }
      else if(msgContent === "4"){
        await client.sendMessage(senderId, 'У Вас есть 3Д рентген снимок Ваших челюстей? Ответьте "да" или "нет"');
      }
      else if(msgContent === "5" || msgContent === "6"){
          await client.sendMessage(senderId, "Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи");
      }
      else if(msgContent === "7"){
          await client.sendMessage(senderId, "Напишите Ваш вопрос, Вам ответит администратор в ближайшее рабочее время");
      }
      else if(msgContent === "8"){
          await client.sendMessage(senderId, "Напишите Ваше ФИО, администратор предложит Вам время записи");
      }
      else if(msgContent === "9"){
          await client.sendMessage(senderId, "Напишите Ваше ФИО, отменим Вашу запись");
      }
    }
    else if(lastBotMsg === 'у вас есть страховка медикер (на работе выдавали карту медикер)? ответьте "да" или "нет"'){
      if(msgContent === "да" || msgContent === "нет"){
        await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
      }
    }
    else if(lastBotMsg === 'у вас есть 3д рентген снимок ваших челюстей? ответьте "да" или "нет"'){
      if(msgContent === "да"){
        await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
      }
      else if(msgContent === "нет"){
          await client.sendMessage(senderId, 'Снимок 3Д можно сделать по адресу: ул.Ерубаева, 58 (Академия красоты, 4 кабинет) либо: ул.Костенко, 10 (клиника Дантист)');
          await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
      }
    }
    else if(lastBotMsg.includes("просим вас подтвердить вашу запись")){
        if(msgContent.includes("да")){
            await client.sendMessage(senderId, 'Будем ждать Вас!');
          }
        else {
            return;
        }
    }
    else{
        if (msgContent.includes('здравствуйте') || msgContent.includes('привет') || msgContent.includes('добрый') || msgContent.includes('доброе') || msgContent.includes('салам')) {
            await client.sendMessage(senderId, 'Здравствуйте! Вас рада приветствовать стоматология ИДЕАЛ!\n Наш сайт: ideal-stom.kz\n Наш инстаграм: @idealstom.krg\n \nС Вами на связи робот, просим Вас сообщить, что Вас интересует: \n 1. Запись на лечение зуба/ов\n 2. Запись на чистку зубов, лечение десен\n 3. Запись на удаление зуба/ов\n 4. Запись на консультацию по имплантам\n 5. Запись на консультацию по брекетам (исправлению прикуса)\n 6. Запись на консультацию по протезированию\n 7. Хочу задать вопрос\n 8. Прошу перенести мою запись\n 9. Прошу отменить мою запись\n\nВведите ответ цифрой от 1 до 9');
        }
    }

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
    const fetchedMessages = await chat.fetchMessages({ limit: 10, fromMe: true });

    // Convert the last 10 messages to the specified JSON format
    const last10Messages = fetchedMessages.map(message => ({
      messageDate: new Date(message.timestamp*1000).toLocaleString(),
      messageText: message.body || '' 
    }));

    return res.json({ last10Messages });
  } catch (error) {
    console.error('Error fetching last 10 messages:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    client.initialize();
    
  });