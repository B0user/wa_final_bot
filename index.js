const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox']
    }
});

const STATE_FILE = 'user_states.json';


client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();
 
function loadStates() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading state file:', err);
    }
    return {};
}

// Сохранение состояний в файл
function saveStates(states) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(states, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing state file:', err);
    }
}

let userStates = loadStates();

client.on('message', async message => {
    const senderId = message.from;
    const msgContent = message.body.toLowerCase().trim();
    const currentState = userStates[senderId] || {};

    if (msgContent.includes === 'здравствуйте' || msgContent.includes === 'добрый') {
        // Установка начального шага, ожидание ввода пользователя
        currentState.step = '0';
        await client.sendMessage(senderId, "Здравствуйте! Вас рада приветствовать стоматология ИДЕАЛ!\n Наш сайт: ideal-stom.kz\n Наш инстаграм: @idealstomkrg\n С Вами на связи робот, просим Вас сообщить, что Вас интересует: \n 1. Запись на лечение зуба/ов\n 2. Запись на чистку зубов, лечение десен\n 3. Запись на удаление зуба/ов\n 4. Запись на консультацию по имплантам\n 5. Запись на   консультацию по брекетам (исправлению прикуса)\n 6. Запись на   консультацию по протезированию\n 7. Хочу задать вопрос\n 8. Прошу перенести мою запись\n 9. Прошу отменить мою  запись");
    }
    switch (currentState.step) {
        case '0':
            // Пользователь только начал взаимодействовать, бот ожидает выбора опции
            if (msgContent.includes("1") ||  msgContent.includes("2") || msgContent.includes("3")) {
                await client.sendMessage(senderId, 'У вас есть страховка? Ответьте "да" или "нет"');
                currentState.step = 'mediker';
            } 
            else if(msgContent.includes("4")){
                await client.sendMessage(senderId, 'У вас есть 3Д рентген снимок Ваших челюстей?');
                currentState.step = 'rentgen';
            }
            else if(msgContent.includes("5") || msgContent.includes("6")){
                await client.sendMessage(senderId, "Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи");
                currentState.step = 'fio_i_dr';
            }
            else if(msgContent.includes("7")){
                await client.sendMessage(senderId, "Напишите ваш вопрос, Вам ответит администратор в ближайшее рабочее время");
                currentState.step = 'vopros';
            }
            else if(msgContent.includes("8")){
                await client.sendMessage(senderId, "Напишите Ваше ФИО, администратор предложит Вам время записи");
                currentState.step = 'fio_perenos';
            }
            else if(msgContent.includes("9")){
                await client.sendMessage(senderId, "Напишите Ваше ФИО, отменим Вашу запись");
                currentState.step = 'fio_otmena';
            }
            else {
                // Если ввод пользователя не совпадает ни с одной опцией
                
            }
            break;
        case 'mediker':
            if(msgContent.includes("да") || msgContent.includes("нет")){
                await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
                currentState.step = 'fio_i_dr';
            }
            else{
                
            }
            break;
        case 'rentgen':
            if(msgContent.includes("да")){
                await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
                currentState.step = 'fio_i_dr';
            }
            else if(msgContent.includes("нет")){
                await client.sendMessage(senderId, 'Снимок 3Д можно сделать по адресу: ул.Ерубаева, 58 (Академия красоты, 4 кабинет) либо: ул.Костенко, 10 (клиника Дантист)');
                currentState.step = 'net_3d_rentgena';
            }
            else{
                
            }
            break;
        default:
            currentState.step = '0';
            break;
    }
    userStates[senderId] = currentState;
    saveStates(userStates);
});