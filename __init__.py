from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify
from pymongo import MongoClient
from random import randint
from jsonmerge import merge
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

@app.route('/insert')
def insertAnno():
    spotify_uid = str(request.args.get('uid', type = str))
    track_id = str(request.args.get('track', type = str))
    annotation = str(request.args.get('anno', type = str))
    seconds = str(request.args.get('sec', type = str))
    refresh_token = str(request.args.get('refresh_token', type = str))
    #     create json with given data
    #     spotify track id is the id
    #     then the annotations object holds annotations where seconds is the key to each annotation
    jsonData = { '_id' : track_id, "annotations" : { seconds :  annotation } }
    #   tries to insert json as new. cant create duplicate documents of the id
    #   so if it fails it goes to the except (catch), and just inserts
    #   the new annotation into the existing document
    try:
        db[spotify_uid].insert_one(jsonData)
        return "done"
    except:
        #   define the query (what we are looking for)
        query = { '_id' : track_id }
        #   create new json with receieved data
        newJson = { seconds : annotation }
        #   get cursor (array) of existing results
        existingResults = db[spotify_uid].find(query)
        #   from the first result merge the existing annotations and the new one
        mergedJson = merge(newJson, existingResults[0]["annotations"])
        #   now we overwrite the annotations object in the document with our merged json
        updateString = db[spotify_uid].update(query, {"$set" : {"annotations" : mergedJson }})
        return "New Json: " + str(newJson) + "\n" + "Old Json: " + str(existingResults[0]["annotations"]) + "\n" + "Merged Json: " + str(mergedJson)

@app.route('/retrieve')
def retrieve():
    spotify_uid = str(request.args.get('uid', type = str))
    track_id = str(request.args.get('track', type = str))
    #   define the query (what we are looking for)
    query = { '_id' : track_id }
    result = ""
    try:
        result = db[spotify_uid].find(query)[0]["annotations"]
    except IndexError as e:
        return jsonify({"0" : "You have no annotations for this song!"})

    return result

#DON'T CHANGE
app.run(host="0.0.0.0", port=2052, ssl_context=context)
