const express = require("express");
const axios = require("axios");
const cookieParser = require("cookie-parser");
const liquidViews = require("liquid-express-views");
const exp = express();
exp.use(cookieParser());
exp.use(express.urlencoded({extended: true}));
const app = liquidViews(exp);
const url = "https://www.famark.com/host/api.svc/api"

app.get("/", (req, res) => {
    let errorLogin = req.query["error"];
    res.render("login.liquid", { Error: errorLogin });
})


function axiosLoginRequest(suffix, data, headers, res, redirectPath) {
    
    axios.post(url + suffix, data, headers)
        .then(async (response) => {
            const sessionId = await response.data;
            res.cookie("SessionId", sessionId);
            await res.redirect(redirectPath)
        })
        .catch((error) => {
            const errorLogin = error;
            res.redirect("/?error=" + encodeURIComponent(errorLogin));
        })
}

function axiosAPIRequest(suffix, data, headers, res, redirectPath) {

    axios.post(url + suffix, data, { headers })
        .then( async (response) => {
            console.log(response.headers);
            await res.clearCookie("Business_ContactId");
            await res.redirect("/home");
        }) 
        .catch((error) => {
            const errorLogin = error;
            console.log(error)
            res.redirect("/home?error=" + encodeURIComponent(errorLogin));
        })
}


app.post("/login", (req, res) => {
    axiosLoginRequest(
        "/Credential/Connect",
        JSON.stringify(req.body),
        null,
        res,
        "/home"
    )
});

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

app.get("/createRecord", (req, res) => {
    res.render("createRecord.liquid");
})

app.post("/createRecord", (req, res) => {

    axiosAPIRequest(
        "/Business_Contact/CreateRecord",
        JSON.stringify(req.body),
        headers = {
            SessionId: req.cookies["SessionId"],
        },
        res,
        "/home"
    )
})

app.get("/edit", (req, res) => {
    const phone = req.query['phone'];
    const email = req.query['email'];
    const firstName = req.query['firstName'];
    const lastName = req.query['lastName'];
    res.render("edit.liquid", {"phone": phone, "firstName": firstName, "lastName": lastName, "email": email});
})

app.post("/edit", (req, res) => {

    const UpdateData = JSON.stringify({
        Business_ContactId: req.cookies["Business_ContactId"],
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Phone: req.body.Phone,
        Email: req.body.Email,
    });

    axiosAPIRequest(
        "/Business_Contact/UpdateRecord",
        UpdateData,
        headers = {
            SessionId: req.cookies["SessionId"],
        },
        res,
        "/home"
    )
})

app.get('/delete',(req,res)=>{
    
    axiosAPIRequest(
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