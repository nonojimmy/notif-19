# Notif19 COVID-19 Text Update Script

This project is a script to send daily Canadian provincial COVID-19 updates to subscribed users via text message.

-   Data is retrieved from the [Open Covid API](https://opencovid.ca/api/#time-series-data)
-   Text messaging is powered by [Twilio](https://www.twilio.com)
-   The script is scheduled and run as a [Lambda function](https://aws.amazon.com/lambda/)

Once subscribed, the user will receive a text message ~1pm UTC in the following format:

```
👋 Good morning! Here is your COVID-19 update for yesterday: 22-04-2021:

Quebec
New cases: 1248
New cases were up 31 📈 from the day before - be careful.

We will get through this! Stay safe ❤️
```


## TODOs and Next Steps

-   set up webhook to allow users to subscribe via text message
-   set up webhook to allow users to unsubscribe via text message
-   include more information in text update:
    -   hospitalizations
    -   positive test rate
    -   ...?
