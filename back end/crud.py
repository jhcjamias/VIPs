import mysql.connector
import flask
from mysql.connector import Error
from flask_cors import CORS
from flask import jsonify, request 

import creds #local file
from sqlhelper import create_connection, execute_query, execute_read_query


#create a conneciton to MySQL db
myCreds = creds.Creds() #this is a constructor. tells python how to create an object 
conn = create_connection(myCreds.conString, myCreds.userName, myCreds.password, myCreds.dbName)

#set up application
app = flask.Flask(__name__)
CORS(app)
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
    existing_event = execute_read_query(conn, date_query, (newDate,))

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
    capacity_query = "SELECT capacity AS count FROM event WHERE id = %s"
    event_capacity = execute_read_query(conn, capacity_query, (event_id,))

    if not event_capacity:
        return jsonify({'message': 'Event not found'})
    
    event_capacity = event_capacity[0]['count']

    # Function to count current registration for the event
    count_query = "SELECT COUNT(*) AS count FROM registration WHERE event_id = %s"
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
        line = f'{id}: {name} | {title} | {level}'
        member_list.append(line)
    
    return member_list
        

@app.route('/events',methods=["GET"]) #Jamie 
def read_events():

    events =  execute_read_query(conn,'select * from event order by date')
    event_list = []

    for event in events:
        id = event['id']
        name = event['name']
        capacity = event['capacity']
        level = event['level']
        date = event['date']
        line = f'{id}: {name} | {capacity} | {level} | {date}'
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

    #getting member name and level based on event_id. I wanted to do this in one query 
    query = '''select event_id, member.name, member.level, member_id
    from registration join member on member_id=member.id
    where event_id=%s;'''
    members_attending = execute_read_query(conn,query,(event,)) #adding a comma after event makes the returned list a tuple

    list = []

    for member in members_attending:
        name = member['name']
        level = member['level']
        line = f'{member['member_id']}: {name} | {level}'
        list.append(line)

    return jsonify(f'registration list for event {event}',list)



#####################################################
#                                                   #
#               All Update Functions                #
#                                                   #
#####################################################

@app.route('/member',methods=["PATCH"]) #Jamie
def update_member():
    #test body in Postman
    request_data =  request.get_json() 
    id = request_data['member_id'] 
    date = request_data['date'] #theoretically would reference today's date or the date the update is being made 

    #update only the name
    if 'name' in request_data:
        new_name = request_data['name']
        query = '''update member 
        set name = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_name,id))

    #update only the details
    if 'details' in request_data:
        new_details = request_data['details']
        query = '''update member 
        set details = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_details,id))

    #update only the title
    if 'title' in request_data:
        new_title = request_data['title']
        query = '''update member 
        set title = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_details,id))

    #update only the level 
    #if member is registered to an event with a higher tier and the update makes them an invalid member, then an error would show
    if 'level' in request_data:
        new_level = request_data['level']

        #pulling list of member's registered events after specified date 
        query = '''select registration.id as 'r#', event_id, level
        from registration
        join event on event_id=event.id
        where member_id=%s and event.date>%s;'''
        members_registered_events = execute_read_query(conn,query,(id,date))

        levels = {
            'bronze':1,
            'silver':2,
            'gold':3
        }

        #generates list of events that the member could not attend if their level changes
        too_high_events = []
        for upcoming_events in members_registered_events:
            if levels[new_level] < levels[upcoming_events['level']]:
                too_high_events.append(upcoming_events['event_id'])
            
        if len(too_high_events) != 0:
            return f"""Member {id} cannot change to {new_level} because they have an upcoming event in a higher tier
            Please remove their name from the following events: {too_high_events}"""

        #all checks passed. member level can change 
        query = '''update member 
        set level = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_level,id))

    return "member updated"


@app.route('/event',methods=["PATCH"]) #Jamie
def update_event():
    #test body in Postman
    request_data =  request.get_json() 
    id = request_data['event_id']
    date = request_data['current_date'] #ideally, this would be today's date 

    #update only the name
    if 'name' in request_data:
        new_name = request_data['name']
        query = '''update event 
        set name = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_name,id))

    #update only the capacity
    if 'capacity' in request_data:
        new_capacity = request_data['capacity']

        #pull number of members registered for event
        query = '''select count(*)
        from registration
        where event_id=%s;'''
        attending = execute_read_query(conn,query,(id,))
        num_attending = attending[0]['count(*)']

        #check if new capacity < current number of members attending 
        if new_capacity < num_attending:
            return f"there are {num_attending-new_capacity} more people attending than specified capacity. try again"

        #all capacity checks passed
        query = '''update event 
        set capacity = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_capacity,id))

    #update only the level 
    if 'level' in request_data:
        new_level = request_data['level']

        levels = {
            'bronze':1,
            'silver':2,
            'gold':3
        }

        #look at the levels of the members attending the event
        query = '''select member_id, member.level
        from registration
        join member on member_id=member.id
        where event_id=%s;'''
        attending = execute_read_query(conn,query,(id,))

        #see if there are any members who cannot attend the event if the level became higher  
        too_high = []
        for person in attending:
            if levels[person['level']] < levels[new_level]:
                too_high.append(person['member_id'])
        
        if len(too_high) != 0: 
            return f"there are {len(too_high)} members at a higher level than the new level. try again"

        #all level checks passed 
        query = '''update event 
        set level = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_level,id)) 
    
    #update only the date 
    if 'date' in request_data:
        new_date = request_data['date']

        #if date has passed, cannot change it
        if new_date < date:
            return "date has already passed"
        
        #date checks passed 
        query = '''update event 
        set date = %s
        where id = %s;
        '''
        execute_query(conn,query,(new_date,id))
    
    return "event updated"


@app.route('/registration',methods=["PATCH"]) #Jamie
def update_registration():
    '''
    This is a redundant function
    If user wanted to change the event or member of an existing registration,
    it would be the same as deleting the registration, then creating a new registration
    '''
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

    #SQL statement queries to delete member from registration and member table
    registration_query = "DELETE FROM registration WHERE member_id = %s"
    member_query = "DELETE FROM member WHERE id = %s"

    execute_query(conn, registration_query, (member_id,))
    execute_query(conn, member_query, (member_id,))

    return jsonify({'message': 'Member deleted successfully'})


@app.route('/event',methods=["DELETE"])
def delete_event():
    request_data = request.get_json()
    event_id = request_data['id']

    #SQL statement queries to delete event from registration and event table
    registration_query = "DELETE FROM registration WHERE event_id = %s"
    event_query = "DELETE FROM event WHERE id = %s"

    execute_query(conn, registration_query, (event_id,))
    execute_query(conn, event_query, (event_id,))

    return jsonify({'message': 'Event deleted successfully'})


@app.route('/registration',methods=["DELETE"])
def delete_registration():
    request_data = request.get_json()
    registration_id = request_data['id']

    #SQL statement query to delete registration from registration table
    registration_query = "DELETE FROM registration WHERE id = %s"

    execute_query(conn, registration_query, (registration_id,))

    return jsonify({'message': 'Registration deleted successfully'}) 


app.run()