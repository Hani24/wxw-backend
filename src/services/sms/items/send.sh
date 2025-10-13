#!/bin/bash
curl --include \
     --header "Authorization: Basic c3VwcG9ydEBjcnlwdG9wb2tlci53b3JsZDo4MDc4REJCQS1DN0VCLUI1RjgtMkM1NS1EM0VEREYwQzQ3Mjk="  \
     --request POST \
     --header "Content-Type: application/json" \
     --data-binary "    {
        \"messages\":[
            {
                \"source\":\"morris-armstrong\",
                \"body\":\"Some test - 123\",
                \"to\":\"+32498403994\"
            }
        ]
    }" \
'https://rest.clicksend.com/v3/sms/send'

# {
#   "http_code": 200,
#   "response_code": "SUCCESS",
#   "response_msg": "Messages queued for delivery.",
#   "data": {
#     "total_price": 0.0811,
#     "total_count": 1,
#     "queued_count": 1,
#     "messages": [
#       {
#         "direction": "out",
#         "date": 1633396675,
#         "to": "+32498403994",
#         "body": "Some test - 123",
#         "from": "+32460205620",
#         "schedule": 1633396675,
#         "message_id": "47A6BC44-C501-4049-BAEF-30CD7848CFD8",
#         "message_parts": 1,
#         "message_price": "0.0811",
#         "from_email": null,
#         "list_id": null,
#         "custom_string": "",
#         "contact_id": null,
#         "user_id": 274284,
#         "subaccount_id": 311325,
#         "country": "BE",
#         "carrier": "Orange",
#         "status": "SUCCESS"
#       }
#     ],
#     "_currency": {
#       "currency_name_short": "EUR",
#       "currency_prefix_d": "€",
#       "currency_prefix_c": "c",
#       "currency_name_long": "Euros"
#     }
#   }
# }