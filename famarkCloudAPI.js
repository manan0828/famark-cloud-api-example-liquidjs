const axios = require("axios"); //axios functions
const { body, validationResult } = require("express-validator");

const url = "https://www.famark.com/host/api.svc/api"; //API url

//Axios request to login into the domain

function axiosLoginRequest(suffix, data, headers, res, redirectPath) {
    
    axios.post(url + suffix, data, headers)
        .then(async (response) => {
            const sessionId = await response.data; //await till session id generates 
            res.cookie("SessionId", sessionId);
            await res.redirect(redirectPath) //redirect to the path provided
        })
        .catch((error) => {
            const errorLogin = error;
            res.redirect("/?error=" + encodeURIComponent(errorLogin));
        })
}

//Axios request to Update/Delete/Create Data

function axiosAPIRequest(suffix, data, headers, res, redirectPath) {

    axios.post(url + suffix, data, { headers })
        .then( async (response) => {
            await res.clearCookie("Business_ContactId"); 
            await res.redirect(redirectPath);
        }) 
        .catch((error) => {
            const errorLogin = error;
            console.log(error)
            res.redirect("/home?error =" + encodeURIComponent(errorLogin));
        })
}

//Performing Input Validation
let inputValidation = [
    body("firstName")
        .notEmpty()
        .isLength({ max: 15 })
        .withMessage("Invalid Field")
        .escape(),
    body("lastName")
        .notEmpty()
        .isLength({ max: 15})
        .withMessage("Invalid Field")
        .escape(),
    body("phone")
        .notEmpty()
        .isLength({ max: 15})
        .withMessage("Invalid Message")
        .escape(),
    body("email")
        .notEmpty()
        .isEmail()
        .withMessage("Invalid Field")
        .normalizeEmail(),
]

//Export functions to be accessed by other files

module.exports = {
    axiosLoginRequest,
    axiosAPIRequest,
    inputValidation
}