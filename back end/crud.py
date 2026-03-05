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

#Calvin - Added function to add a new member to the Member table in the database
@app.route('/member',methods=["POST"])
def add_member():
    #cursor = conn.cursor(dictionary=True)
    request_data = request.get_json()

    newName = request_data['name']
    newDetails = request_data['details']
    newTitle = request_data['title']
    newLevel = request_data['level']

    query = "INSERT INTO member (name, details, title, level) VALUES (%s, %s, %s, %s)"
    #cursor.execute(query, (newName, newDetails, newTitle, newLevel))
    #conn.commit()
    execute_query(conn,query,(newName, newDetails, newTitle, newLevel))
    return jsonify({'message': 'Member added successfully'})


#Calvin - Added function to add a new event to the Event table in the database
@app.route('/event',methods=["POST"])
def add_event():
    request_data = request.get_json()
    
    newName = request_data['name']
    newCapacity = request_data['capacity']
    newLevel = request_data['level']
    newDate = request_data['date']

    # Check if an event already exists on this date
    date_query = "SELECT * FROM event WHERE date = %s"
    existing_event = execute_query(conn, date_query, (newDate,))

    if existing_event:
        return jsonify({'message': 'An event already exists on this date'})

    # If it passes the date check, it adds the event to the table in the database
    query = "INSERT INTO event (name, capacity, level, date) VALUES (%s, %s, %s, %s)"
    execute_query(conn, query, (newName, newCapacity, newLevel, newDate))
    return jsonify({'message': 'Event added successfully'})


#Calvin - Added function to add a new registration to the Registration table in the database
@app.route('/registration',methods=["POST"])
def add_registration():
    '''
    RULES:
    member cannot register for the same event twice
    members of the same (or higher) level may attend the event
    member can register if event is not yet at capacity
    '''
    request_data = request.get_json()
    member_id = request_data['member_id']
    event_id = request_data['event_id']

    # Check if the member is already registered for an event
    duplicate_query = "SELECT * FROM registration WHERE member_id = %s AND event_id = %s"
    duplicate_registration = execute_read_query(conn, duplicate_query, (member_id, event_id))

    if duplicate_registration:
        return jsonify({'message': 'Member is already registered for this event'})
    
    # Function to check level eligibility of a member

    #Grabs member level
    member_query = "SELECT level FROM member WHERE id = %s"
    member_result = execute_read_query(conn, member_query, (member_id,))

    #grabs event level
    event_query = "SELECT level FROM event WHERE id = %s"
    event_result = execute_read_query(conn, event_query, (event_id,))

    if not member_result or not event_result:
        return jsonify({'message': 'Member or event not found'})
    
    member_level = member_result[0]['level']
    event_level = event_result[0]['level']

    # Define the levels in order
    levels = {
        'bronze': 1,
        'silver': 2,
        'gold': 3
    }

    # If statement to check if member level meets event level requirements
    if levels[member_level] < levels[event_level]:
        return jsonify({'message': "Member's level does not meet the requirements to register for this event"})

    # Function to read the event capacity
    capacity_query = "SELECT COUNT(*) AS count from registration WHERE event_id = %s"
    event_capacity = execute_read_query(conn, capacity_query, (event_id,))

    if not event_capacity:
        return jsonify({'message': 'Event not found'})
    
    event_capacity = event_capacity[0]['count']

    # Function to count current registration for the event
    count_query = "SELECT COUNT(*) as count FROM registration WHERE event_id = %s"
    capacity_result = execute_read_query(conn, count_query, (event_id,))
    current_capacity = capacity_result[0]['count']

    # If statement to check if event is at full capacity
    if current_capacity >= event_capacity:
        return jsonify({'message': 'Event is at full capacity'})

    # If it passes the duplicate and capacity checks, it adds the registration to the table in the database
    insert_query = "INSERT INTO registration (member_id, event_id) VALUES (%s, %s)"
    execute_query(conn, insert_query, (member_id, event_id))
    return jsonify({'message': 'Registration added successfully'}) 


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

@app.route('/member',methods=["PATCH"]) #Jamie
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

@app.route('/event',methods=["PATCH"]) #Jamie
def update_event():
    #test body in Postman
    request_data =  request.get_json() 
    id = request_data['id']

    #update only the name
    if 'name' in request_data:
        new_name = request_data['name']
        query = f'''update event 
        set name = {new_name}
        where id = {id};
        ("{new_name}",{id})'''
        execute_query(conn,query)

    #update only the capacity
    if 'capacity' in request_data:
        new_capacity = request_data['capacity']

        #check if new capacity < current number of members attending
        query = f'select count(id)'
        num_attending = 0


        query = f'''update event 
        set capacity = {new_capacity}
        where id = {id};
        ("{new_capacity}",{id})'''
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

@app.route('/registration',methods=["PATCH"])
def update_registration():
    pass 


#####################################################
#                                                   #
#               All Delete Functions                #
#                                                   #
#####################################################

#Calvin - Added function to delete a member from the Member table in the database
@app.route('/member',methods=["DELETE"])
def delete_member():
    request_data = request.get_json()
    member_id = request_data['id']



@app.route('/event',methods=["DELETE"])
def delete_event():
    pass 

@app.route('/registration',methods=["DELETE"])
def delete_registration():
    pass 


app.run()