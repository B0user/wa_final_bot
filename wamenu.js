// wamenu.js
const fs = require('fs');

// {NEW} check number
const checkSenderInJSON = (jsonFilePath, targetNumber) => {
  return new Promise((resolve) => {
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Произошла ошибка в checkSenderInJSON:', err);
        resolve(false); 
        return;
      }

      try {
        const jsonData = JSON.parse(data);
        const numbers = jsonData.numbers;

        const found = numbers.includes(targetNumber);
        resolve(found);
      } catch (parseError) {
        console.error('Ошибка парсинга clientbase.json:', parseError);
        resolve(false); 
      }
    });
  });
};


const jsonFilePath = 'clientbase.json';


async function wasSpecificMessageSentToday(client, chatId, searchText) {
  const chat = await client.getChatById(chatId);

  const fetchedMessages = await chat.fetchMessages({ limit: 50, fromMe: true });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  return fetchedMessages.some(message => {
      const messageDate = new Date(message.timestamp * 1000);
      messageDate.setHours(0, 0, 0, 0); 

      return messageDate.getTime() === today.getTime() && 
              message.body && 
              message.body.toLowerCase().trim() === searchText.toLowerCase();
  });
}


const addSenderIdToJSON = (jsonFilePath, senderId) => {
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Ошибка при чтении clientbase.json в функции записи:', err);
      return;
    }

    try {
      const jsonData = JSON.parse(data);
      if (!jsonData.numbers) {
        jsonData.numbers = [];
      }
      jsonData.numbers.push(senderId);
      fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Ошибка при записи в clientbase.json:', writeErr);
        } else {
          console.log('SenderId добавлен в список номеров в clientbase.json.');
        }
      });
    } catch (parseError) {
      console.error('Ошибка парсинга clientbase.json:', parseError);
    }
  });
};


async function handleMenu(client, message) {
    const senderId = message.from;
    const msgContent = message.body.toLowerCase().trim();
    const chat = await message.getChat();

    //exclude groups
    if (chat.isGroup) {
      return;
    }
    
    let OldChat;
    checkSenderInJSON(jsonFilePath, senderId).then((found) => {
      OldChat = found;
        if (found) {
          console.log(`senderID найден в файле clientbase.json. Клиент ${senderId} не является новым`);
        } else {
          console.log(`Номер не найден в файле clientbase.json. Клиент ${senderId} начал чат`);
        }
    });


    //ignore non-text messages
    if(message._data.type != "chat"){
      console.log(`User ${senderId} sent non-text message`)
      return;
    }

    const fetchedMessageFromBot = await chat.fetchMessages({"limit": 1, "fromMe": true})
    const menuMessageText = 'Здравствуйте! Вас рада приветствовать стоматология ИДЕАЛ!\n Наш сайт: ideal-stom.kz\n Наш инстаграм: @idealstom.krg\n \nС Вами на связи робот, просим Вас сообщить, что Вас интересует: \n 1. Запись на лечение зуба/ов\n 2. Запись на чистку зубов, лечение десен\n 3. Запись на удаление зуба/ов\n 4. Запись на консультацию по имплантам\n 5. Запись на консультацию по брекетам (исправлению прикуса)\n 6. Запись на консультацию по протезированию\n 7. Хочу задать вопрос\n 8. Прошу перенести мою запись\n 9. Прошу отменить мою запись\n\nВведите ответ цифрой от 1 до 9';

    const lastBotMsg = fetchedMessageFromBot[0]?.body?.toLowerCase();
    const wasSentToday = await wasSpecificMessageSentToday(client, senderId, menuMessageText.toLowerCase());

    console.log(`lastbBotMsg: ${lastBotMsg}\nwasSentToday: ${wasSentToday}\nmsgContent: ${msgContent}\nisGreetings: ${isGreetings(msgContent)}`)
    
    // Если вообще нет наших сообщений, то дальше код не вести вообще
    if (lastBotMsg === menuMessageText.toLowerCase()) {
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


    else{
        if ((!lastBotMsg && OldChat == false) || (lastBotMsg && isGreetings(msgContent) && !isGreetings(lastBotMsg.trim()) && !wasSentToday)){
          
          if(lastBotMsg && isGreetings(msgContent) && !isGreetings(lastBotMsg.trim()) && !wasSentToday){
            console.log(`Greeted, we did not initiated, today first time: ${senderId}`);
          }

          if (!msgContent || isGreetings(msgContent)){

            await client.sendMessage(senderId, menuMessageText);

            if(OldChat == false){
              addSenderIdToJSON(jsonFilePath, senderId);
            }
            
            if(!msgContent){  
              console.log(`Empty msgContent ${senderId}\nLastBotMSG: ${lastBotMsg}\n-----------`);
            }

            else if(isGreetings(msgContent)){
              console.log(`Greeted last bot message: ${senderId}`);
            }

          }
        }
    }

}

function isGreetings(msgContent) {
  if (!msgContent) return false;
  return msgContent.includes('здравствуйте') || msgContent.includes('привет') || msgContent.includes('добрый') || msgContent.includes('доброе') || msgContent.includes('доброго');
}

module.exports = { handleMenu, wasSpecificMessageSentToday };