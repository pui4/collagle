import os
import random
import click
from pathlib import Path
from datetime import date
from flask import Flask, render_template, jsonify, request, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = 'postgresql:///data'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
db.init_app(app)

class Pallet(db.Model):
    date = mapped_column(db.String, primary_key=True)
    pallet = mapped_column(JSONB)
    
class Symbols(db.Model):
    date = mapped_column(db.String, primary_key=True)
    symbols = mapped_column(JSONB)
    
class Content(db.Model):
    id = mapped_column(db.Integer, primary_key=True, autoincrement=True)
    data = mapped_column(JSONB)
    date = mapped_column(db.String, index=True)
    subtitle = mapped_column(db.String)

@click.command("init-db")
def init_db_command():
    with app.app_context():
        db.create_all()
        click.echo("DB created.")

app.cli.add_command(init_db_command)

@app.route("/")
def home():
    return render_template("home.jinja", has_cookie=request.cookies.get(date.today().isoformat(), default=False))

@app.route("/test")
def test():
    return render_template("test_builder.jinja")

def gen_today(seed: str):
    rng = random.Random(seed)
    
    colours = int(os.getenv("PALLET_COLOURS")) # type: ignore
    pallet = []
    
    for _ in range(0, colours):
        gen = f"#{rng.randrange(0x1000000):06x}"
        while gen in pallet:
            gen = f"#{rng.randrange(0x1000000):06x}"
        pallet.append(gen)
        
    num_symbols = int(os.getenv("NUM_SYMBOLS")) # type: ignore
    symbols = []
    
    all_symbols = list(sorted(Path(f"{app.root_path}/static/symbols").glob("*.svg")))
    
    for _ in range(0, num_symbols):
        gen = f"{request.url_root}static/symbols/{all_symbols[rng.randrange(0, len(all_symbols) - 1)].name}"
        while gen in symbols:
            gen = f"{request.url_root}static/symbols/{all_symbols[rng.randrange(0, len(all_symbols) - 1)].name}"
        symbols.append(gen)
    for index, symbol in enumerate(symbols):
        symbols[index] = [symbol, rng.randrange(1, int(os.getenv("MAX_SYMBOL_AMOUNT")))] # type: ignore
    
    return {
        "symbols": symbols,
        "pallet": pallet
    }

@app.route("/api/get_today", methods=['GET'])
def get_today():
    day = date.today().isoformat()
    pallet = db.session.get(Pallet, day)
    symbols = db.session.get(Symbols, day)
    
    if pallet is None or symbols is None:
        todays = gen_today(day)
        pallet = Pallet(date=day, pallet=todays["pallet"]) # type: ignore
        symbols = Symbols(date=day, symbols=todays["symbols"]) # type: ignore
        db.session.add_all([pallet, symbols])
        db.session.commit()
        return jsonify(todays)
    else:
        return jsonify({
            "symbols": symbols.symbols,
            "pallet": pallet.pallet
        })

@app.route("/api/submit", methods=['POST'])
def submit():
    json = request.json
    
    try:
        day = date.today().isoformat()
        pallet = db.session.get(Pallet, day)
        symbols = db.session.get(Symbols, day)
        
        objects = json["children"][0]["children"]
        
        object_dict = {}
        for object in objects:
            attrs = object["attrs"]
            if attrs["id"] in object_dict:
                object_dict[attrs["id"]] += 1
                
                if object_dict[attrs["id"]] > symbols.symbols[attrs["id"]][1]: # type: ignore
                    return "INVALID", 403
            else:
                object_dict[attrs["id"]] = 0
            
            if attrs["current_tint"] not in pallet.pallet: # type: ignore
                return "INVALID", 403
        
        if type(json["attrs"]["subtitle"]) is not str or len(json["attrs"]["subtitle"]) > 500:
            return "INVALID", 403
        
        if json["attrs"]["subtitle"] == "":
            subtitle = "Untitled"
        else:
            subtitle = json["attrs"]["subtitle"]
        
        content = Content(date=day, subtitle=subtitle, data=json) # type: ignore
        db.session.add(content)
        db.session.commit()
        
        resp = make_response("OK")
        resp.set_cookie(
            day,
            "1",
            max_age=60 * 60 * 24,
        )
        
        return resp
    except Exception as e:
        print(e)
        return "INVALID", 403

def main() -> None:
    app.run(debug=True, host="0.0.0.0")
