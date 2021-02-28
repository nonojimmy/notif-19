const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
    throw new Error('Credentials not found');
}

const twilioClient = require('twilio')(accountSid, authToken);

twilioClient.messages
    .create({
        body: 'test test',
        from: '+14159660125',
        to: '+14389218184',
    })
    .then((message) => console.log(message.sid));
