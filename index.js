
//Import files and libraries

const express = require("express"); 
const axios = require("axios");
const cookieParser = require("cookie-parser");
const liquidViews = require("liquid-express-views");
const getFunction = require("./famarkCloudAPI");
const { body, validationResult } = require("express-validator");


const exp = express(); //Express object
exp.use(cookieParser()); //Parsing cookies
exp.use(express.urlencoded({extended: true})); //Url Encoding
const app = liquidViews(exp); //Render and Redirect screens
const url = "https://www.famark.com/host/api.svc/api" //Url 

//Render Login Screen

app.get("/", (req, res) => {
    let errorLogin = req.query["error"];
    res.render("login.liquid", { Error: errorLogin });
})

//Parse credentials from login screen & redirect tp home page

app.post("/login", (req, res) => {

    getFunction.axiosLoginRequest(
        "/Credential/Connect",
        JSON.stringify(req.body),
        null,
        res,
        "/home"
    )

});

//Gte response from API and Display in Home Page

app.get("/home", (req, res) => {

    const sessionId = req.cookies["SessionId"];
    const retrieveData = JSON.stringify({
        Columns: "FullName, Phone, Email, Business_ContactId, FirstName, LastName",
        OrderBy: "FullName"
    });
    
    const loginUrl = url + "/Business_Contact/RetrieveMultipleRecords";
    const headers = {
        SessionId: sessionId
    };

    axios.post(loginUrl, retrieveData, { headers })
        .then(async (response) => {
            let contactData = await response.data;
            res.render("home.liquid", {'contacts': contactData});
        })
        .catch((error) => {
            console.error("Error in retrieving: ", error);
        });

});

//Redirect to Create Record page

app.get("/createRecord", (req, res) => {
    res.render("createRecord.liquid");
})

//Get data from page and parse into API

app.post("/createRecord", getFunction.inputValidation, (req, res) => {

    const validationError = validationResult(req);
    if(!validationError.isEmpty()) {
        return res.render("createRecord.liquid", { error: 'Invalid Field'});
    }
    getFunction.axiosAPIRequest(
        "/Business_Contact/CreateRecord",
        JSON.stringify(req.body),
        headers = {
            SessionId: req.cookies["SessionId"],
        },
        res,
        "/home"
    )

})

//Redirect to edit page and parse data in edit page

app.get("/edit", (req, res) => {
    const phone = req.query['phone'];
    const email = req.query['email'];
    const firstName = req.query['firstName'];
    const lastName = req.query['lastName'];

    res.render("edit.liquid", {
        "phone": phone, 
        "firstName": firstName, 
        "lastName": lastName, 
        "email": email
    });
})

//Parse the new data in API

app.post("/edit", getFunction.inputValidation, (req, res) => {

    const validationError = validationResult(req);
    if(!validationError.isEmpty()) {
        return res.render("edit.liquid", { error: 'Invalid Field' })
    }

    const UpdateData = JSON.stringify({
        Business_ContactId: req.cookies["Business_ContactId"],
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Phone: req.body.Phone,
        Email: req.body.Email,
    });

    getFunction.axiosAPIRequest(
        "/Business_Contact/UpdateRecord",
        UpdateData,
        headers = {
            SessionId: req.cookies["SessionId"],
        },
        res,
        "/home"
    )
})

//Parse Business Id into API and delete record

app.get('/delete',(req,res)=>{
    
    getFunction.axiosAPIRequest(
        "/Business_Contact/DeleteRecord",
        data = JSON.stringify({
            Business_ContactId: req.cookies["Business_ContactId"],
        }),
        headers = {
            SessionId: req.cookies["SessionId"],
        },
        res,
        "/home"
    )

});

app.get('/logout', async (req, res) => {
    await res.clearCookie("SessionId");
    res.redirect("/")
})

app.get('/cancel', async (req, res) => {
    await res.redirect("/home");
})

app.listen(3000, () => {
    console.log("app is running on port: 3000");
})