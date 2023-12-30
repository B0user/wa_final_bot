const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { Client } = require('whatsapp-web.js');
const cron = require('node-cron');
const qrcode = require( 'qrcode-terminal');


const app = express();
const port = 4477;
const ip = '185.225.35.50';

// API to update JSON file
app.use(express.json());
app.use(cors());

const STATE_FILE = 'user_states.json';
const SCHEDULE_FILE = 'schedule.json';

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

////////////////////////
// WhatsApp Bot Logic //
////////////////////////

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

    if (msgContent.includes('здравствуйте') || msgContent.includes('добрый') || msgContent.includes('доброе') || msgContent.includes('салам')) {
        // Установка начального шага, ожидание ввода пользователя
        currentState.step = '0';
        await client.sendMessage(senderId, "Здравствуйте! Вас рада приветствовать стоматология ИДЕАЛ!\n Наш сайт: ideal-stom.kz\n Наш инстаграм: @idealstom.krg\n \n С Вами на связи робот, просим Вас сообщить, что Вас интересует: \n 1. Запись на лечение зуба/ов\n 2. Запись на чистку зубов, лечение десен\n 3. Запись на удаление зуба/ов\n 4. Запись на консультацию по имплантам\n 5. Запись на консультацию по брекетам (исправлению прикуса)\n 6. Запись на консультацию по протезированию\n 7. Хочу задать вопрос\n 8. Прошу перенести мою запись\n 9. Прошу отменить мою запись\n Введите ответ цифрой от 1 до 9");
    }
    switch (currentState.step) {
        case '0':
            // Пользователь только начал взаимодействовать, бот ожидает выбора опции
            if (msgContent === "1" ||  msgContent === "2" || msgContent === "3") {
                await client.sendMessage(senderId, 'У Вас есть страховка Медикер (на работе выдавали карту Медикер)? Ответьте "да" или "нет"');
                currentState.step = 'mediker';
            } 
            else if(msgContent === "4"){
                await client.sendMessage(senderId, 'У Вас есть 3Д рентген снимок Ваших челюстей? Ответьте "да" или "нет"');
                currentState.step = 'rentgen';
            }
            else if(msgContent === "5" || msgContent === "6"){
                await client.sendMessage(senderId, "Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи");
                currentState.step = 'fio_i_dr';
            }
            else if(msgContent === "7"){
                await client.sendMessage(senderId, "Напишите Ваш вопрос, Вам ответит администратор в ближайшее рабочее время");
                currentState.step = 'vopros';
            }
            else if(msgContent === "8"){
                await client.sendMessage(senderId, "Напишите Ваше ФИО, администратор предложит Вам время записи");
                currentState.step = 'fio_perenos';
            }
            else if(msgContent === "9"){
                await client.sendMessage(senderId, "Напишите Ваше ФИО, отменим Вашу запись");
                currentState.step = 'fio_otmena';
            }
            else {
                // Если ввод пользователя не совпадает ни с одной опцией
                
            }
            break;
        case 'mediker':
            if(msgContent === "да" || msgContent === "нет"){
                await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
                currentState.step = 'fio_i_dr';
            }
            else{
                
            }
            break;
        case 'rentgen':
            if(msgContent === "да"){
                await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
                currentState.step = 'fio_i_dr';
            }
            else if(msgContent === "нет"){
                await client.sendMessage(senderId, 'Снимок 3Д можно сделать по адресу: ул.Ерубаева, 58 (Академия красоты, 4 кабинет) либо: ул.Костенко, 10 (клиника Дантист)');
                await client.sendMessage(senderId, 'Напишите Ваше ФИО и дату рождения полностью, администратор предложит Вам время записи');
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








/////////////////////////////
// WhatsApp Notifier Logic //
/////////////////////////////

// Schedule the script to run every day at 14:30
cron.schedule('30 8 * * *', async () => {
    const scheduleData = fs.readFileSync(SCHEDULE_FILE, 'utf8');
    const appointments = JSON.parse(scheduleData);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const appointment of appointments) {
        const appointmentDate = new Date(appointment.date);

        // Check if the appointment is tomorrow and not sent
        if (isSameDay(appointmentDate, tomorrow) && !appointment.sentd) {
            await sendMessage(appointment);
            appointment.sentd = true;
        }
    }

    // Update the schedule.json file with the modified appointments
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(appointments, null, 2), 'utf8');
});

// Function to check if two dates are on the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

cron.schedule('0 0-15 * * *', async () => {
    const scheduleData = fs.readFileSync(SCHEDULE_FILE, 'utf8');
    const appointments = JSON.parse(scheduleData);

    const now = new Date();

    for (const appointment of appointments) {
        const appointmentDate = new Date(appointment.date);
        // Check if the appointment is within 3 hours from now and not sent
        if (isWithin3Hours(appointmentDate, now) && !appointment.senth) {
            await sendMessage(appointment);
            appointment.senth = true;
        }
    }

    // Update the schedule.json file with the modified appointments
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(appointments, null, 2), 'utf8');
});

// Function to check if an appointment is within 3 hours from now
function isWithin3Hours(appointmentDate, now) {
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return appointmentDate > now && appointmentDate <= threeHoursLater;
}

  

// Function to send WhatsApp messages
async function sendMessage(user) {
    const chatId = `${user.phone}@c.us`; // WhatsApp ID format
    const message = `Уважаемый ${user.name}, напоминаем вам о предстоящем событии ${user.date}.`; // Message
  
    try {
      await client.sendMessage(chatId, message);
      console.log(`Сообщение отправлено на ${user.phone}`);
      return true; // Return true if the message is sent
    } catch (error) {
      const chatId = `77012927772@c.us`; // WhatsApp ID format
      const message = `Номер обзвон: ${user.phone}\nИмя: ${user.surname} ${user.name}\n Дата записи:${user.date}`; // Message
      //console.error(`Ошибка при отправке сообщения на ${user.phone}:`, error);
      return false; // Return false in case of an error
    }
  }

client.initialize();








///////////////
// API logic //
///////////////



app.post('/api/updateschedule', async (req, res) => {
    try {
        let incomingData = req.body;
        let existingData = getScheduleData();

        // Parse incoming JSON data (if it's not already parsed)
        if (typeof incomingData === 'string') {
            incomingData = JSON.parse(incomingData);
        }

        // Update existing records or add new records
        incomingData.forEach((newRecord) => {
            const existingIndex = findIndexByPhone(existingData, newRecord.phone);
            if (existingIndex !== -1) {
                // Update existing record
                existingData[existingIndex] = { ...existingData[existingIndex], ...newRecord };
            } else {
                // Add new record
                existingData.push({ ...newRecord, sentd: false, senth: false });
            }
        });

        // Remove records that are not in the incoming data
        existingData = existingData.filter((existingRecord) =>
            incomingData.some((newRecord) => newRecord.phone === existingRecord.phone)
        );

        // Save the updated data to schedule.json
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(existingData, null, 2), 'utf8');

        res.status(200).json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Function to find the index of a record by phone number
function findIndexByPhone(data, phone) {
    return data.findIndex((record) => record.phone === phone);
}

// Function to get the current schedule data
function getScheduleData() {
    try {
        const data = fs.readFileSync(SCHEDULE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading schedule file:', error);
        return [];
    }
}

// Start the server
app.listen(port, ip, () => {
  console.log(`Server is running on http://${ip}:${port}`);
});