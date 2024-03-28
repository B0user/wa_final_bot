const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const port = 4477;
const ip = "185.225.35.50";

// API to update JSON file
app.use(express.json());
app.use(cors());



const SCHEDULE_FILE = 'schedule.json';
const NOTIFICATION_FILE = 'notification.json';
const BDAYS_FILE = 'bdays.json';





function systemizeAppointments() {
    try {
        
        // Get the current date and time
        const currentTime = new Date();
        const formattedTime = currentTime.toLocaleString();
        // Read the schedule.json file
        const scheduleData = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));

        // Filter out all but the earliest appointment for each phone number per day
        const earliestAppointments = scheduleData.reduce((acc, appointment) => {
            const date = new Date(appointment.date);
            const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const phoneKey = appointment.phone;

            // Create a unique key for each day and phone number
            const uniqueKey = `${dayKey}-${phoneKey}`;

            if (!acc[uniqueKey] || new Date(acc[uniqueKey].date) > date) {
                // Clone the appointment object excluding 'sentd' and 'senth'
                const { sentd, senth, ...appointmentData } = appointment;
                acc[uniqueKey] = appointmentData;
            }

            return acc;
        }, {});

        // Extract the filtered appointments
        const filteredAppointments = Object.values(earliestAppointments);

        // Group appointments by day
        const groupedAppointments = filteredAppointments.reduce((acc, appointment) => {
            const date = new Date(appointment.date);
            const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

            if (!acc[dayKey]) {
                acc[dayKey] = [];
            }

            acc[dayKey].push(appointment);
            return acc;
        }, {});

        // Convert the grouped appointments to an array
        const organizedAppointments = Object.entries(groupedAppointments).map(([date, appointments]) => ({
            date,
            appointments,
        }));

        // Save the organized appointments to notification.json
        fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(organizedAppointments, null, 2), 'utf8');


        console.log(`Appointments systemized and saved successfully. Time: ${formattedTime}`);
    } catch (error) {
        console.error(`Error systemizing appointments (Time: ${formattedTime}) -> `, error);
    }
}


/////////////////////////////
// WhatsApp Notifier Logic //
/////////////////////////////
function composeMessage(data) {
    const formattedDate = new Date(data.date).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });

    const messageData = {
        phone: data.phone,
        text: `Здравствуйте, ${data.surname} ${data.name}! \nУ Вас запись на приём ${formattedDate}. \n\nПросим Вас подтвердить Вашу запись. Ответьте «да», «нет», «прошу перенести мою запись». \n\nПросим Вас прийти без группы поддержки, кроме случаев сопровождения несовершеннолетних детей. \n\nС уважением, Стоматология Идеал.`,
        success: `(Сообщение отправлено) \nИмя: ${data.surname} ${data.name} \nДата записи: ${formattedDate}`,
        error: `(Сообщение не отправлено) \nНомер телефона: \n${data.phone}\nИмя: ${data.surname} ${data.name} \nДата записи: ${formattedDate}`,
    };

    return messageData;
}


function composeMessageTomorrow(data) {
    const formattedDate = new Date(data.date).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });

    const messageData = {
        phone: data.phone,
        text: `Здравствуйте, ${data.surname} ${data.name}! \nУ Вас завтра запись на приём ${formattedDate}. \n\nПросим Вас подтвердить Вашу запись. Ответьте «да», «нет», «прошу перенести мою запись». \n\nПросим Вас прийти без группы поддержки, кроме случаев сопровождения несовершеннолетних детей. \n\nС уважением, Стоматология Идеал.`,
        success: `(Сообщение отправлено) \nИмя: ${data.surname} ${data.name} \nДата записи: ${formattedDate}`,
        error: `(Сообщение не отправлено) \nНомер телефона: \n${data.phone}\nИмя: ${data.surname} ${data.name} \nДата записи: ${formattedDate}`,
    };

    return messageData;
}

function composeBDayList(data) {
    let text = `День рождения (дд.мм): ${data[0].bday}`;

    for (const person of data) { text += `\n---------------\n${person.name} ${person.surname} (${person.age})\n${person.phone}`; }

    const messageData = {
        text: text,
        success: `(success)`,
        error: `(error)`,
    };

    return messageData;
}

/// CRON ///

cron.schedule('0 12 * * *', async () => {
    const bdaydata = fs.readFileSync(BDAYS_FILE, 'utf8');
    const bdayinfo = JSON.parse(bdaydata);

    let messageData = composeBDayList(bdayinfo);

    await sendMessageAdmin(messageData);

    // Update the notification.json file with the modified appointments
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notificationDays, null, 2), 'utf8');
});



cron.schedule('30 13 * * *', async () => {
    const notificationData = fs.readFileSync(NOTIFICATION_FILE, 'utf8');
    const notificationDays = JSON.parse(notificationData);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const day of notificationDays) {
        for (const appointment of day.appointments) {
            const appointmentDate = new Date(appointment.date);

            // Check if the appointment is tomorrow and not sent
            if (isSameDay(appointmentDate, tomorrow) && !appointment.sentd) {
                const messageData = composeMessageTomorrow(appointment);
                await sendMessage(messageData);
            }
        }
    }

    // Update the notification.json file with the modified appointments
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notificationDays, null, 2), 'utf8');
});

// Function to check if two dates are on the same day
function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
}

cron.schedule('* 7-21 * * *', async () => {
    const notificationData = fs.readFileSync(NOTIFICATION_FILE, 'utf8');
    const notificationDays = JSON.parse(notificationData);

    const now = new Date();

    for (const day of notificationDays) {
        for (const appointment of day.appointments) {
            const appointmentDate = new Date(appointment.date);
            // Check if the appointment is within 2:05 - 1:55 hours from now and not sent
            if (isWithinRangeBeforeAppointment(appointmentDate, now)) {
                const messageData = composeMessage(appointment);
                
                const isSentAdminError = await isSentAlready(messageData.error, "77028579133");
                if (!isSentAdminError){
                    const isSent = await isSentAlready(messageData.text, appointment.phone);
                    if (!isSent){
                        await sendMessage(messageData);
                    }
                }
            }
        }
    }

    // Update the notification.json file with the modified appointments
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notificationDays, null, 2), 'utf8');
});
// Function to check if an appointment is within 1 hour 55 minutes to 2 hours 5 minutes from now
function isWithinRangeBeforeAppointment(appointmentDate, now) {
    const lowRange = new Date(now.getTime() + 115 * 60 * 1000);
    const highRange = new Date(now.getTime() + 125 * 60 * 1000);

    return appointmentDate > lowRange && appointmentDate < highRange;
}
// Function to check whether we already sent notification earlier
async function isSentAlready(text, phone) {
    try {
      // Make an Axios request to get the last messages
      const response = await axios.get(`http://localhost:9990/api/getlastmessages/${phone}`);
      const lastMessages = response.data.last10Messages;
  
      // Check if the text exists in any of the last messages
      return lastMessages.some(message => message.messageText === text);
    } catch (error) {
    //   console.error('Error checking if message is sent already:', error);
      // Return false in case of an error
      return false;
    }
  }


// Function to send WhatsApp messages using API
async function sendMessage(messageData) {
    // Get the current date and time
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleString();
    const apiEndpoint = 'http://localhost:9990/api/sendone'; // API endpoint

    try {
        const response = await axios.post(apiEndpoint, messageData);
        console.log(`Сообщение успешно -> ${messageData?.phone}. Time: ${formattedTime}`);
        return true; // Return true if the message is sent
    } catch (error) {
        // console.error(`Ошибка при отправке сообщения: ${error.message}`);
        return false; // Return false in case of an error
    }
}

async function sendMessageAdmin(messageData) {
    // Get the current date and time
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleString();
    const apiEndpoint = 'http://localhost:9990/api/sendadmin'; // API admin endpoint

    try {
        await axios.post(apiEndpoint, messageData);
        console.log(`Сообщение Admin успешно -> Time: ${formattedTime}`);
        return true; // Return true if the message is sent
    } catch (error) {
        // console.error(`Ошибка при отправке сообщения: ${error.message}`);
        return false; // Return false in case of an error
    }
}







///////////////
// API logic //
///////////////




app.post('/api/updateschedule', (req, res) => {
    try {
        let incomingData = req.body;
        // Parse incoming JSON data (if it's not already parsed)
        if (typeof incomingData === 'string') {
            incomingData = JSON.parse(incomingData);
        }
        // Save the incoming data to schedule.json
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(incomingData, null, 2), 'utf8');
        systemizeAppointments();
        
        res.status(200).json({ message: 'Schedule updated successfully' });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/updatebdaylist', (req, res) => {
    try {
        let incomingData = req.body;
        // Parse incoming JSON data (if it's not already parsed)
        if (typeof incomingData === 'string') {
            incomingData = JSON.parse(incomingData);
        }
        // Save the incoming data to schedule.json
        fs.writeFileSync(BDAYS_FILE, JSON.stringify(incomingData, null, 2), 'utf8');
        systemizeAppointments();
        
        res.status(200).json({ message: 'Bday List updated successfully' });
    } catch (error) {
        console.error('Error updating bday list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




// Start the server
app.listen(port, ip, () => {
    console.log(`Server is running on http://${ip}:${port}`);
  });