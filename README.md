# Notif19 COVID-19 Text Update Script

This project is a script to send daily Canadian provincial COVID-19 updates to subscribed users via text message.

-   Data is retrieved from the [Open Covid API](https://opencovid.ca/api/#time-series-data)
-   Text messaging is powered by [Twilio](https://www.twilio.com)
-   The script is scheduled and run as a [Lambda function](https://aws.amazon.com/lambda/)

## TODOs and Next Steps

-   send all updates in same text message
-   set up webhook to allow users to subscribe via text message
-   set up webhook to allow users to unsubscribe via text message
