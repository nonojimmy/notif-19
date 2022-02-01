import axios from 'axios';
import { MongoClient } from 'mongodb';
import dateformat from 'dateformat';
import twilio from 'twilio';
import {
    ProvinceSummary,
    Province,
    OpenCovidResponse,
} from './types/OpenCovidResponse';
import { User } from './types/User';
import { EmptyApiResponseException } from './exceptions/EmptyApiResponseException';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
    apiBaseUrl,
    buildUpdateMessage,
    createUpdateMessageMap,
    getPreviousDate,
} from './utils';

const mongoUser = process.env.MONGO_USER;
const mongoPass = process.env.MONGO_PASS;
const mongoDbName = process.env.MONGO_DB_NAME;
const mongoCollectionName = process.env.MONGO_COLLECTION_NAME;

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error('Twilio credentials not found');
}

if (!mongoUser || !mongoPass || !mongoDbName || !mongoCollectionName) {
    throw new Error('Mongo user credentials not found');
}

if (!twilioPhoneNumber) {
    throw new Error('Twilio phone number not found');
}

const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
const mongoUri = `mongodb+srv://${mongoUser}:${mongoPass}@cluster0.mmhb4.mongodb.net/${mongoDbName}?retryWrites=true&w=majority`;

let cachedMongoClient: MongoClient;

const connectToMongo = async (): Promise<MongoClient> => {
    if (cachedMongoClient && cachedMongoClient.isConnected()) {
        return cachedMongoClient;
    }

    const mongoClient = new MongoClient(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    await mongoClient.connect();

    cachedMongoClient = mongoClient;

    return cachedMongoClient;
};

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    let users: User[];
    const mongoClient = await connectToMongo();
    try {
        users = await mongoClient
            .db(mongoDbName)
            .collection(mongoCollectionName)
            .find()
            .toArray();
    } catch (e) {
        throw new Error(`Error connecting to DB: ${e.message}`);
    } finally {
        await mongoClient.close();
    }

    // CONVERT TO EST
    const dateNowEST = new Date().getTime() + 3600000 * -5;
    const dateYesterday = getPreviousDate(dateNowEST);
    const datePreviousDay = getPreviousDate(dateYesterday.getDate());
    const yesterdayFormatted = dateformat(dateYesterday, 'dd-mm-yyyy');
    const prevDayFormatted = dateformat(datePreviousDay, 'dd-mm-yyyy');

    const yesterdaySummaries = (
        await axios.get<OpenCovidResponse>(
            `${apiBaseUrl}/summary?date=${yesterdayFormatted}`
        )
    ).data.summary;

    if (yesterdaySummaries.length < 1) {
        throw new EmptyApiResponseException(yesterdayFormatted);
    }

    const prevDaySummaries = (
        await axios.get<OpenCovidResponse>(
            `${apiBaseUrl}/summary?date=${prevDayFormatted}`
        )
    ).data.summary;

    const updateMsgByProvince = createUpdateMessageMap();

    yesterdaySummaries.forEach((summary) => {
        const { province } = summary;

        if (!Object.values(Province).includes(province)) {
            return;
        }

        const prevDaySummary = prevDaySummaries.find(
            (prev) => prev.province === province
        ) as ProvinceSummary;

        updateMsgByProvince.set(
            province,
            buildUpdateMessage(summary, prevDaySummary)
        );
    });

    await Promise.all(
        users.map(async (user) => {
            let message = `Good morning! Here is your COVID-19 update for yesterday: ${yesterdayFormatted}:\n\n`;

            user.subscribedProvinces.forEach((province, i) => {
                message += updateMsgByProvince.get(province);
                message += '\n\n';
                if (i === user.subscribedProvinces.length - 1) {
                    message += 'We will get through this! Stay safe :)';
                }
            });

            await twilioClient.messages
                .create({
                    body: message,
                    from: twilioPhoneNumber,
                    to: user.phoneNumber,
                })
                .catch((err) => console.log(err.message));
        })
    );

    return {
        statusCode: 200,
        body: 'Finished running job',
    };
};
