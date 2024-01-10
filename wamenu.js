// wamenu.js
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

    if (chat.isGroup) {
      return;
    }

    const fetchedMessageFromBot = await chat.fetchMessages({"limit": 1, "fromMe": true})

    const menuMessageText = 'Здравствуйте! Вас рада приветствовать стоматология ИДЕАЛ!\n Наш сайт: ideal-stom.kz\n Наш инстаграм: @idealstom.krg\n \nС Вами на связи робот, просим Вас сообщить, что Вас интересует: \n 1. Запись на лечение зуба/ов\n 2. Запись на чистку зубов, лечение десен\n 3. Запись на удаление зуба/ов\n 4. Запись на консультацию по имплантам\n 5. Запись на консультацию по брекетам (исправлению прикуса)\n 6. Запись на консультацию по протезированию\n 7. Хочу задать вопрос\n 8. Прошу перенести мою запись\n 9. Прошу отменить мою запись\n\nВведите ответ цифрой от 1 до 9';

    // console.log(fetchedMessageFromBot[0]);
    // console.log(fetchedMessageFromBot[0]?.body?.toLowerCase());
    // console.log(msgContent);

    const lastBotMsg = fetchedMessageFromBot[0]?.body?.toLowerCase();
    const wasSentToday = await wasSpecificMessageSentToday(client, senderId, "здравствуйте! вас рада приветствовать стоматология идеал!\n наш сайт: ideal-stom.kz\n наш инстаграм: @idealstom.krg\n \nс вами на связи робот, просим вас сообщить, что вас интересует: \n 1. запись на лечение зуба/ов\n 2. запись на чистку зубов, лечение десен\n 3. запись на удаление зуба/ов\n 4. запись на консультацию по имплантам\n 5. запись на консультацию по брекетам (исправлению прикуса)\n 6. запись на консультацию по протезированию\n 7. хочу задать вопрос\n 8. прошу перенести мою запись\n 9. прошу отменить мою запись\n\nвведите ответ цифрой от 1 до 9");

    // Если вообще нет наших сообщений, то дальше код не вести вообще
    if (!lastBotMsg){
        if (msgContent.includes('здравствуйте') || msgContent.includes('привет') || msgContent.includes('добрый') || msgContent.includes('доброе')) {
            await client.sendMessage(senderId, menuMessageText);
        }
        return; // все.
    }


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
    else{
        if(!lastBotMsg.trim().includes("здравствуйте")){ 
            if (!wasSentToday && (msgContent.includes('здравствуйте') || msgContent.includes('привет') || msgContent.includes('добрый') || msgContent.includes('доброе'))) {
                await client.sendMessage(senderId, menuMessageText);
            }
        }
    }

}

module.exports = { handleMenu, wasSpecificMessageSentToday };