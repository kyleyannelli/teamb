from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from pymongo import MongoClient
from random import randint
import random
#KEEP ALL SSL, NEEDED HTTPS FOR WEB PLAYER
import ssl
context = ssl.SSLContext()

context.load_cert_chain('certificate.crt', 'private.key')

#Step 1: Connect to MongoDB - Note: Change connection string as needed
client = MongoClient("mongodb+srv://testuser1:testuser1@teamb.ibkvl.mongodb.net/test")
db = client.annotations

app = Flask(__name__)
IS_DEV = app.env == 'development'  # FLASK_ENV env. variable

app.debug = True


@app.route("/")
def homepage():
    return render_template("index.html")

@app.route("/player")
def player():
    return render_template("player.html")

@app.route("/clientSecret", methods=["GET", "POST"])
def sendSecret():
    if request.method == "POST":
        message = {'clientSecret': 'daab896cb43846d995865e9d40296b01'}
        return jsonify(message)
    return "hey."

@app.route("/insertRan")
def inRan():
    # The limit for the extended ASCII Character set
    MAX_LIMIT = 122

    random_string = ''

    for _ in range(10):
        random_integer = random.randint(97, MAX_LIMIT)
        #    Keep appending random characters using chr(x)
        random_string += (chr(random_integer))

    jsonData = { 'ranData' : randint(232, 232232) }
    codeString = "db." + random_string + ".insert_one(jsonData)"
    exec(codeString)
    return "success?"

@app.route('/insert')
def insertAnno():
    #teamb.dev:2052/insert?page=asdjiasdji&stuff=asdjiasd
    #https://teamb.dev:2052/insert?uid=SJIDAJSID&track=SJIDIAD&anno=STUFF_HERE_YEAHHH&sec=324
    #collection
    spotify_uid = str(request.args.get('uid', type = str))
    #sub collection
    track_id = str(request.args.get('track', type = str))
    annotation = str(request.args.get('anno', type = str))
    seconds = str(request.args.get('sec', type = str))
    #make receieved annotation into json
    jsonData = { '_id' : track_id, seconds :  annotation}

    try:
        insertString = "db." + spotify_uid + ".insert_one(jsonData)"
        exec(insertString)
        return "done"
    except:
        updateString = "db." + spotify_uid + ".update_one(jsonData)"
        exec(updateString)
        return "appended to object"

#DON'T CHANGE
app.run(host="0.0.0.0", port=2052, ssl_context=context)
