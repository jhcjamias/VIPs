// load the things we need
var express = require('express');
var app = express();
const bodyParser  = require('body-parser');
const path = require('path');

// required module to make calls to a REST API
const axios = require('axios');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname));

// set the view engine to ejs
app.set('view engine', 'ejs');

//members page
app.get('/', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5000/members');
        const membersData = response.data;
        
        res.render('pages/members', { members: membersData });
    } catch (error) {
        console.error("Error fetching members:", error.message);
        res.render('pages/members', { members: [] });
    }
});


app.listen(8080, () => console.log('Server is running on port 8080'));