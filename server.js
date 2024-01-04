const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const port = 4477;
const ip = "192.168.0.102";

// API to update JSON file
app.use(express.json());
app.use(cors());



const SCHEDULE_FILE = 'schedule.json';
const NOTIFICATION_FILE = 'notification.json';





function systemizeAppointments() {
    try {
        // Read the schedule.json file
        const scheduleData = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf8'));

        // Group appointments by day
        const groupedAppointments = scheduleData.reduce((acc, appointment) => {
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

        console.log('Appointments systemized and saved successfully.');
    } catch (error) {
        console.error('Error systemizing appointments:', error);
    }
}




/////////////////////////////
// WhatsApp Notifier Logic //
/////////////////////////////

cron.schedule('30 14 * * *', async () => {
    const notificationData = fs.readFileSync(NOTIFICATION_FILE, 'utf8');
    const notificationDays = JSON.parse(notificationData);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const day of notificationDays) {
        for (const appointment of day.appointments) {
            const appointmentDate = new Date(appointment.date);

            // Check if the appointment is tomorrow and not sent
            if (isSameDay(appointmentDate, tomorrow) && !appointment.sentd) {
                await sendMessage(appointment);
                appointment.sentd = true;
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

cron.schedule('* * * * *', async () => {
    // systemizeAppointments();
    const apiEndpoint = 'http://localhost:9990/api/sendone'; 
    const messageData = {
        phone: '77028579133',
        text: 'test',
        success: 'test message',
        error: 'error message',
    };

    try {
        const response = await axios.post(apiEndpoint, messageData);
        console.log(`Сообщение успешно: ${response}`);
        return true; // Return true if the message is sent
    } catch (error) {
        console.error(`Ошибка при отправке сообщения: ${error.message}`);
        return false; // Return false in case of an error
    }
    // const notificationData = fs.readFileSync(NOTIFICATION_FILE, 'utf8');
    // const notificationDays = JSON.parse(notificationData);

    // const now = new Date();

    // for (const day of notificationDays) {
    //     for (const appointment of day.appointments) {
    //         const appointmentDate = new Date(appointment.date);

    //         // Check if the appointment is within 3 hours from now and not sent
    //         if (isWithin3Hours(appointmentDate, now) && !appointment.senth) {
    //             await sendMessage(appointment);
    //             appointment.senth = true;
    //         }
    //     }
    // }

    // // Update the notification.json file with the modified appointments
    // fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notificationDays, null, 2), 'utf8');
});

// Function to check if an appointment is within 3 hours from now
function isWithin3Hours(appointmentDate, now) {
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    return appointmentDate > now && appointmentDate <= threeHoursLater;
}

  

// Function to send WhatsApp messages using API
async function sendMessage(data) {
    const apiEndpoint = 'http://localhost:9990/api/sendone'; // API endpoint
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
        text: `Здравствуйте, ${data.surname} ${data.name}! \nУ Вас запись на приём ${formattedDate}. \nПросим Вас подтвердить Вашу запись. Ответьте «да», «нет», «прошу перенести мою запись». \nС уважением, Стоматология Идеал.`,
        success: `(Сообщение отправлено) \nИмя: ${data.surname} ${data.name} \nДата записи: ${formattedDate}`,
        error: `(Сообщение не отправлено) \nНомер телефона: \n${data.phone}\nИмя: ${data.surname} ${data.name} \nДата записи: ${formattedDate}`,
    };

    try {
        const response = await axios.post(apiEndpoint, messageData);
        console.log(`Сообщение успешно: ${response}`);
        return true; // Return true if the message is sent
    } catch (error) {
        console.error(`Ошибка при отправке сообщения: ${error.message}`);
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




// Start the server
app.listen(port, ip, () => {
    console.log(`Server is running on http://${ip}:${port}`);
  });