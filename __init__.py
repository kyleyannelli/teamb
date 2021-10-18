from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify

app = Flask(__name__)
IS_DEV = app.env == 'development'  # FLASK_ENV env. variable

app.debug = True


@app.route("/")
def homepage():
    return render_template("index.html")


@app.route("/clientSecret", methods=["GET", "POST"])
def sendSecret():
    if request.method == "POST":
        message = {'clientSecret': 'daab896cb43846d995865e9d40296b01'}
        return jsonify(message)
    return "hey."


@app.route("/player")
def player():
    return render_template("player.html")


context = ('server.crt', 'server.key')
app.run(host="0.0.0.0", port=2052)
