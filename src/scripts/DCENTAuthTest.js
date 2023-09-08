const dcent = require('dcent-web-connector');

dcent
    .info()
    .then(
        response => {
            console.log("Hello");
            console.log(response);
        }
    ).catch(error => {
        console.log("Authentication error:", error);
    });