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

// routes members data from Flask API
app.get('/', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5000/members');
        const membersData = response.data;
        
        res.render('pages/members', { members: membersData, path: '/' });
    } catch (error) {
        console.error("Error fetching members:", error.message);
        res.render('pages/members', { members: [] });
    }
});

//routes events data from Flask API
app.get('/events', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5000/events');
        const eventsData = response.data;
        
        res.render('pages/events', { events: eventsData, path: '/events' });
    } catch (error) {
        console.error("Error fetching events:", error.message);
        res.render('pages/events', { events: [] });
    }
});

app.get('/register', async (req, res) => {
    try {
        // get members from Flask API
        const memberResponse = await axios.get('http://localhost:5000/members');
        const membersData = memberResponse.data;

        // We pass an empty array for events because regScript.js will fetch them dynamically now
        res.render('pages/registration', { members: membersData, events: [], path: '/register'});
        
    } catch (error) {
        console.error("Error fetching registration:", error.message);
        res.render('pages/registration', { members: [], events: [] });
    }
});


app.listen(8080, () => console.log('Server is running on port 8080'));