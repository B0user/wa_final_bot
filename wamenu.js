// wamenu.js
const fs = require('fs');

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

async function handleMenu(client, message) {
    const senderId = message.from;
    const msgContent = message.body.toLowerCase().trim();
    const chat = await message.getChat();

    // BASIC SETTINGS
    const menuMessageText = 'Здравствуйте! Вас рада приветствовать стоматология ИДЕАЛ!\n Наш сайт: ideal-stom.kz\n Наш инстаграм: @idealstom.krg\n \nС Вами на связи робот, просим Вас сообщить, что Вас интересует: \n 1. Запись на лечение зуба/ов\n 2. Запись на чистку зубов, лечение десен\n 3. Запись на удаление зуба/ов\n 4. Запись на консультацию по имплантам\n 5. Запись на консультацию по брекетам (исправлению прикуса)\n 6. Запись на консультацию по протезированию\n 7. Хочу задать вопрос\n 8. Прошу перенести мою запись\n 9. Прошу отменить мою запись\n\nВведите ответ цифрой от 1 до 9';

    // CHECK CORRECTNESS OF INPUT
    if (chat.isGroup) {
      return;
    }
    if (!msgContent) {
      // Logs to figure it out
      console.log(`400: EmptyMessage from ${senderId}\ncontent: ${message}`);
      // What to do when empty? - nothing
      return;
    }

    // Get Last Message From Us
    let fetchedMessageFromBot, lastBotMsg;
    try {
      fetchedMessageFromBot = await chat.fetchMessages({"limit": 1, "fromMe": true})
      lastBotMsg = fetchedMessageFromBot[0]?.body?.toLowerCase();
    }
    catch(err){
      console.log(`500: Error while fetching lastBotMsg :${err}`);
    }

    // Check if today sent menu
    const wasSentToday = await wasSpecificMessageSentToday(client, senderId, menuMessageText.toLowerCase());

    // THE MENU FLOW
    switch(lastBotMsg){
      case menuMessageText.toLowerCase(): // Flow from the menu
        switch(msgContent) {
          case "1":
            await client.sendMessage(senderId, 'У Вас есть страховка Медикер (на работе выдавали карту Медикер)? Ответьте "да" или "нет"');
            break;
          case "2":
            await client.sendMessage(senderId, 'У Вас есть страховка Медикер (на работе выдавали карту Медикер)? Ответьте "да" или "нет"');
            break;
          case "3":
            await client.sendMessage(senderId, 'У Вас есть страховка Медикер (на работе выдавали карту Медикер)? Ответьте "да" или "нет"');
            break;
          case "4":
            await client.sendMessage(senderId, 'У Вас есть 3Д рентген снимок Ваших челюстей? Ответьте "да" или "нет"');
            break;
          case "5":
            await client.sendMessage(senderId, "Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи");
            break;
          case "6":
            await client.sendMessage(senderId, "Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи");
            break;
          case "7":
            await client.sendMessage(senderId, "Напишите Ваш вопрос, Вам ответит администратор в ближайшее рабочее время");
            break;
          case "8":
            await client.sendMessage(senderId, "Напишите Ваше ФИО, администратор предложит Вам время записи");
            break;
          case "9":
            await client.sendMessage(senderId, "Напишите Ваше ФИО, отменим Вашу запись");
            break;
          default:
            // if msgContent is empty - checked at the very beggining
            break;
        }
        break;

      case 'у вас есть страховка медикер (на работе выдавали карту медикер)? ответьте "да" или "нет"':
        if(msgContent === "да" || msgContent === "нет"){
          await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
        }
        break;

      case 'у вас есть 3д рентген снимок ваших челюстей? ответьте "да" или "нет"':
        if(msgContent === "да"){
          await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
        }
        else if(msgContent === "нет"){
            await client.sendMessage(senderId, 'Снимок 3Д можно сделать по адресу: ул.Ерубаева, 58 (Академия красоты, 4 кабинет) либо: ул.Костенко, 10 (клиника Дантист)');
            await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
        }
        break;
    
      default: // Other Flows
        if(isGreetings(msgContent)){
          console.log(`${senderId} sent greetings`);
          if (!lastBotMsg){ // new chat, no messages from us yet
            await client.sendMessage(senderId, menuMessageText); // we replied with menu
          }
          else {
            if (!wasSentToday && !isGreetings(lastBotMsg.trim())){ //today no menu, we did not greeted
              await client.sendMessage(senderId, menuMessageText); // we replied with menu
            }
          }
        }
        break;
    }


}

function isGreetings(msgContent) {
  if (!msgContent) return false;
  return msgContent.includes('здравствуйте') || msgContent.includes('привет') || msgContent.includes('добрый') || msgContent.includes('доброе') || msgContent.includes('доброго');
}

module.exports = { handleMenu, wasSpecificMessageSentToday };