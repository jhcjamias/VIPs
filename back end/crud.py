import mysql.connector
import flask
from mysql.connector import Error
from flask import jsonify, request 

import creds #local file
from sqlhelper import create_connection, execute_query, execute_read_query


#create a conneciton to MySQL db
myCreds = creds.Creds() #this is a constructor. tells python how to create an object 
conn = create_connection(myCreds.conString, myCreds.userName, myCreds.password, myCreds.dbName)

#set up application
app = flask.Flask(__name__)
app.config["DEBUG"] = True

#create tables
query = '''
create table if not exists member (
    id int unsigned auto_increment not null primary key,
    name varchar(25) not null,
    details varchar(255),
    title varchar(25) not null, 
    level enum('bronze','silver','gold')
);
create table if not exists event (
    id int unsigned auto_increment not null primary key,
    name varchar(25) not null,
    capacity int(5) unsigned not null,
    level enum('bronze','silver','gold') not null,
    date date not null
);
create table if not exists registration (
    id int unsigned auto_increment not null primary key,
    event_id int unsigned,
    member_id int unsigned,
    foreign key (event_id) references event(id),
    foreign key (member_id) references member(id)
);
'''

#execute_query(conn,query)


@app.route('/', methods=['GET'])
def home():
    return "<h>Home Page</h>"


#####################################################
#                                                   #
#               All Create Functions                #
#                                                   #
#####################################################

@app.route('/member',methods=["POST"])
def add_member():
    pass 

@app.route('/event',methods=["POST"])
def add_event():
    pass 

@app.route('/registration',methods=["POST"])
def add_registration():
    '''
    RULES:
    member cannot register for the same event twice
    members of the same (or higher) level may attend the event
    member can register if event is not yet at capacity
    '''
    pass 


#####################################################
#                                                   #
#                All Read Functions                 #
#                                                   #
#####################################################

@app.route('/members',methods=["GET"]) #Jamie
def read_members():
    #get list of members 
    members =  execute_read_query(conn, 'select * from member')

    member_list = []

    for member in members:
        id = member['id']
        name = member['name']
        title = member['title']
        level = member['level']
        line = f'{id}: {name} | {title} | {level} ({id},"{name}","{title}","{level}")'
        member_list.append(line)
    
    return member_list
        

@app.route('/events',methods=["GET"]) #Jamie 
def read_events():

    events =  execute_read_query(conn,'select * from event')
    event_list = []

    for event in events:
        id = event['id']
        name = event['name']
        capacity = event['capacity']
        level = event['level']
        date = event['date']
        line = f'{id}: {name} | {capacity} | {level} | {date} ({id},"{name}","{capacity}","{level}","{date}")'
        event_list.append(line)

    return event_list

@app.route('/registrations',methods=["GET"]) #Jamie
def read_registration():
    '''
    RULES:
    query will show the registered members for one event
    '''
    request_data = request.get_json()
    event = request_data['event_id'] 

    #getting members attending this event
    query = f'select member_id from registration where event_id={event} ({event})'
    members_attending = execute_read_query(conn,query)

    #getting member list
    query = 'select * from member'
    members = execute_read_query(conn,query)

    #blank list to put in names
    list = []

    #match members attending to all members list
    for registered in members_attending:
        for a_member in members:
            if registered["member_id"] == a_member["id"]:
                id = a_member['id']
                name = a_member['name']
                title = a_member['title']
                level = a_member['level']
                line = f'{id}: {name} | {title} | {level} ({id},"{name}","{title}","{level}")'
                list.append(line)
    
    return list



#####################################################
#                                                   #
#               All Update Functions                #
#                                                   #
#####################################################

@app.route('/member',methods=["PATCH"])
def update_member():
    #test body in Postman
    request_data =  request.get_json() 
    id = request_data['id']

    #update only the name
    if 'name' in request_data:
        new_name = request_data['name']
        query = f'''update member 
        set name = {new_name}
        where id = {id};
        ("{new_name}",{id})'''
        execute_query(conn,query)

    #update only the details
    if 'details' in request_data:
        new_details = request_data['details']
        query = f'''update member 
        set details = {new_details}
        where id = {id};
        ("{new_details}",{id})'''
        execute_query(conn,query)

    #update only the title
    if 'title' in request_data:
        new_title = request_data['title']
        query = f'''update member 
        set title = {new_title}
        where id = {id};
        ("{new_title}",{id})'''
        execute_query(conn,query)

    #update only the level 
    if 'level' in request_data:
        new_level = request_data['level']
        query = f'''update member 
        set level = {new_level}
        where id = {id};
        ("{new_level}",{id})'''
        execute_query(conn,query)

@app.route('/event',methods=["PATCH"])
def update_event():
    pass 

@app.route('/registration',methods=["PATCH"])
def update_registration():
    pass 


#####################################################
#                                                   #
#               All Delete Functions                #
#                                                   #
#####################################################

@app.route('/member',methods=["DELETE"])
def delete_member():
    pass 

@app.route('/event',methods=["DELETE"])
def delete_event():
    pass 

@app.route('/registration',methods=["DELETE"])
def delete_registration():
    pass 


app.run()