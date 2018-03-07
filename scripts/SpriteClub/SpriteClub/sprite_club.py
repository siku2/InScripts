from flask import Flask, abort, jsonify, request

from .mugen import Character, compare_chars

app = Flask(__name__)


@app.route("/")
def index():
    return "Nothing to show here!"


@app.route("/character/<name>")
def get_character(name: str):
    level = request.args.get("level", "1")
    if level.isnumeric():
        level = int(level)
    else:
        abort(400)
    char = Character.search(name)
    if not char:
        abort(400)
    return jsonify(char.to_dict(level))


@app.route("/compare")
def compare():
    blue_name = request.args.get("blue", None)
    red_name = request.args.get("red", None)
    if not all((blue_name, red_name)):
        abort(400)
    blue = Character.search(blue_name)
    red = Character.search(red_name)
    if not all((blue, red)):
        abort(400)
    comparison = compare_chars(blue, red)
    data = {
        "characters": {
            "blue": blue.to_dict(),
            "red": red.to_dict()
        },
        "comparison": comparison._asdict()
    }
    return jsonify(data)
