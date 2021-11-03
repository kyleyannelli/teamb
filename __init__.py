import base64
import os

from flask import Flask, redirect
from flask import render_template
from flask import request
from flask import jsonify
from pymongo import MongoClient
from random import randint
from jsonmerge import merge
import requests
import random
# KEEP ALL SSL, NEEDED HTTPS FOR WEB PLAYER
import ssl
import re

context = ssl.SSLContext()

context.load_cert_chain('certificate.crt', 'private.key')

# Step 1: Connect to MongoDB - Note: Change connection string as needed
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

@app.route("/authorization", methods=["GET", "POST"])
def getAuthorization():
    #url = ""
    client_id = "c6f5c006684341518ba23d7bae85b169"
    client_secret = "daab896cb43846d995865e9d40296b01"
    code = str(request.args.get('code', type=str))
    # if request.method == "POST":
    #     url = "https://accounts.spotify.com/authorize"
    #     url += "?client_id=" + client_id
    #     url += "&response_type=code"
    #     url += "&redirect_uri=http://127.0.0.1:5000/player"#add redirect URL
    #     url += "&show_dialog=true"
    #     url += "&scope=user-read-private%20user-read-email%20user-modify-playback-state%20user-read-playback-position%20user-library-read%20streaming%20user-read-playback-state%20user-read-recently-played%20playlist-read-private"
    #     print(url)
    #
    # redirect(url)

    # body = "grant_type=authorization_code"
    # body += "&code=" + code
    # body += "&redirect_uri=http://teamb.dev:2052/player"#add redirect URL
    # body += "&client_id=" + client_id
    # body += "&client_secret=" + client_secret
    auth_header = base64.urlsafe_b64encode((client_id + ':' + client_secret).encode('ascii'))
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic %s' % auth_header.decode('ascii')
    }
    payload = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': 'https://teamb.dev:2052/player',
        'client_id': client_id,
        'client_secret': client_secret,
    }

    # Make a request to the /token endpoint to get an access token
    access_token_request = requests.post("https://accounts.spotify.com/api/token", data=payload, headers=headers)

    # convert the response to JSON
    access_token_response_data = access_token_request.json()

    return access_token_response_data
    # Data = requests.post("https://accounts.spotify.com/api/token", data=payload, headers=headers)
    # return str(Data)

@app.route('/insert')
def insertAnno():
    spotify_uid = str(request.args.get('uid', type=str))
    track_id = str(request.args.get('track', type=str))
    annotation = str(request.args.get('anno', type=str))
    seconds = str(request.args.get('sec', type=str))

    refresh_token = str(request.args.get('refresh_token', type=str))
    #     create json with given data
    #     spotify track id is the id
    #     then the annotations object holds annotations where seconds is the key to each annotation
    regexAnnotation = re.sub(r"_+", " ", annotation)
    jsonData = {'_id': track_id, "annotations": {seconds: regexAnnotation}}
    #   tries to insert json as new. cant create duplicate documents of the id
    #   so if it fails it goes to the except (catch), and just inserts
    #   the new annotation into the existing document
    try:
        db[spotify_uid].insert_one(jsonData)
        return "done"
    except:
        #   define the query (what we are looking for)
        query = {'_id': track_id}
        regexAnnotation = re.sub(r"_+", " ", annotation)
        #   create new json with receieved data
        newJson = {seconds: regexAnnotation}
        #   get cursor (array) of existing results
        existingResults = db[spotify_uid].find(query)[0]["annotations"]
        if (seconds in existingResults) != 0:
            edit(spotify_uid, track_id, regexAnnotation, seconds, existingResults)
            return "updated existing annotation."
        # from the first result merge the existing annotations and the new one
        mergedJson = merge(newJson, existingResults)
        #   now we overwrite the annotations object in the document with our merged json
        updateString = db[spotify_uid].update(query, {"$set": {"annotations": mergedJson}})
        return "New Json: " + str(newJson) + "\n" + "Old Json: " + str(existingResults) + "\n" + "Merged Json: " + str(
            mergedJson)


@app.route("/insertDate")
def insertDate():
    spotify_uid = str(request.args.get('uid', type=str))
    track_id = str(request.args.get('track', type=str))
    date = str(request.args.get('date', type=str))

    refresh_token = str(request.args.get('refresh_token', type=str))
    #     create json with given data
    #     spotify track id is the id
    jsonData = {'_id': "datesCollection", "dates" : {track_id: date}}
    try:
        db[spotify_uid].insert_one(jsonData)
        return "done"
    except:
        #   define the query (what we are looking for)
        query = {'_id': "datesCollection"}
        #   create new json with receieved data
        newJson = {track_id: date}
        #   get cursor (array) of existing results
        existingResults = db[spotify_uid].find(query)[0]["dates"]
        if (track_id in existingResults) != 0:
            editDate(spotify_uid, track_id, date, existingResults)
            return "updated existing date."
        # from the first result merge the existing annotations and the new one
        mergedJson = merge(newJson, existingResults)
        #   now we overwrite the annotations object in the document with our merged json
        updateString = db[spotify_uid].update(query, {"$set": {"dates": mergedJson}})
        return "Date Updated"


@app.route('/retrieve')
def retrieve():
    spotify_uid = str(request.args.get('uid', type=str))
    track_id = str(request.args.get('track', type=str))
    #   define the query (what we are looking for)
    query = {'_id': track_id}
    result = ""
    try:
        result = db[spotify_uid].find(query)[0]["annotations"]
        if result == {}:
            return jsonify({"0": "You have no annotations for this song!"})
    except IndexError as e:
        return jsonify({"0": "You have no annotations for this song!"})
    except KeyError as e:
        return jsonify({"0": "You have no annotations for this song!"})
    return result

@app.route('/retrieveDates')
def retrieveDates():
    spotify_uid = str(request.args.get('uid', type=str))
    #   define the query (what we are looking for)
    query = {'_id': "datesCollection"}
    result = ""
    try:
        result = db[spotify_uid].find(query)[0]["dates"]
        if result == {}:
            return jsonify({"0": "Never Played"})
    except IndexError as e:
        return jsonify({"0": "Never Played"})
    except KeyError as e:
        return jsonify({"0": "Never Played"})
    return result

@app.route('/remove')
def remove():
    spotify_uid = str(request.args.get('uid', type=str))
    track_id = str(request.args.get('track', type=str))
    seconds = str(request.args.get('sec', type=str))
    #   define the query (what we are looking for)
    query = {'_id': track_id}
    try:
        #   get cursor (array) of existing results, get first document and the annotations
        existingResults = db[spotify_uid].find(query)[0]["annotations"]
        del existingResults[seconds]
        if existingResults == {}:
            db[spotify_uid].remove(query)
            return "removed document."
        db[spotify_uid].update(query, {"$set": {"annotations": existingResults}})
        return "removed annotation at " + seconds
    except:
        return "couldn't find annotation at " + seconds


# del seconds
# newJson {seconds: anno}
# existing
# merge
# .update


def edit(spt_uid, tk_id, anno, sec, existingResults):
    #   define the query (what we are looking for)
    query = {'_id': tk_id}
    #   create new json with receieved data
    del existingResults[sec]
    regexAnnotation = re.sub(r"_+", " ", anno)
    newJson = {sec: regexAnnotation}
    mergedJson = merge(newJson, existingResults)
    #   now we overwrite the annotations object in the document with our merged json
    db[spt_uid].update(query, {"$set": {"annotations": mergedJson}})

def editDate(spt_uid, tk_id, date, existingResults):
    #   define the query (what we are looking for)
    query = {'_id': "datesCollection"}
    #   create new json with receieved data
    del existingResults[tk_id]
    newJson = {tk_id: date}
    mergedJson = merge(newJson, existingResults)
    #   now we overwrite the annotations object in the document with our merged json
    db[spt_uid].update(query, {"$set": {"dates": mergedJson}})


# DON'T CHANGE
app.run(host="0.0.0.0", port=2052, ssl_context=context)
