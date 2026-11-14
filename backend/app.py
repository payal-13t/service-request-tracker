import logging, os, sqlite3
from contextlib import closing
from flask import Flask, jsonify, request, g
from flask_cors import CORS
PRIORITIES={"Low","Medium","High"}; STATUSES={"Open","In Progress","Resolved"}
def create_app(config=None):
 app=Flask(__name__); app.config.update(TESTING=False,DATABASE=os.environ.get("REQUEST_DB_PATH",os.path.join(os.path.dirname(__file__),"requests.db")))
 if config: app.config.update(config)
 CORS(app); logging.basicConfig(level=logging.INFO); log=logging.getLogger("request_api")
 def db():
  if "db" not in g: g.db=sqlite3.connect(app.config["DATABASE"]); g.db.row_factory=sqlite3.Row
  return g.db
 @app.teardown_appcontext
 def close_db(_err=None):
  conn=g.pop("db",None)
  if conn: conn.close()
 with app.app_context():
  with closing(sqlite3.connect(app.config["DATABASE"])) as conn:
   conn.execute("CREATE TABLE IF NOT EXISTS requests(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,description TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'Open',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"); conn.commit()
 @app.get("/api/health")
 def health(): return jsonify(status="ok"),200
 @app.get("/api/requests")
 def listing(): return jsonify([dict(x) for x in db().execute("SELECT * FROM requests ORDER BY id DESC").fetchall()]),200
 @app.post("/api/requests")
 def create():
  d=request.get_json(silent=True)
  if not isinstance(d,dict): return jsonify(error="A JSON object is required."),400
  title,desc,priority=d.get("title"),d.get("description"),d.get("priority")
  if not isinstance(title,str) or not 3<=len(title.strip())<=120: return jsonify(error="Title must be 3–120 characters."),400
  if not isinstance(desc,str) or not 3<=len(desc.strip())<=1000: return jsonify(error="Description must be 3–1000 characters."),400
  if priority not in PRIORITIES: return jsonify(error="Priority must be Low, Medium or High."),400
  try:
   cur=db().execute("INSERT INTO requests(title,description,priority) VALUES(?,?,?)",(title.strip(),desc.strip(),priority)); db().commit()
   row=db().execute("SELECT * FROM requests WHERE id=?",(cur.lastrowid,)).fetchone(); log.info("Created request id=%s",cur.lastrowid); return jsonify(dict(row)),201
  except sqlite3.Error:
   log.exception("Failed to create request"); return jsonify(error="Unable to save request."),500
 @app.patch("/api/requests/<int:item_id>")
 def update(item_id):
  d=request.get_json(silent=True); status=d.get("status") if isinstance(d,dict) else None
  if status not in STATUSES: return jsonify(error="Invalid status."),400
  conn=db()
  if not conn.execute("SELECT id FROM requests WHERE id=?",(item_id,)).fetchone(): return jsonify(error="Request not found."),404
  conn.execute("UPDATE requests SET status=? WHERE id=?",(status,item_id)); conn.commit(); row=conn.execute("SELECT * FROM requests WHERE id=?",(item_id,)).fetchone(); log.info("Updated request id=%s",item_id); return jsonify(dict(row)),200
 return app
app=create_app()
if __name__=="__main__": app.run(debug=False,port=int(os.environ.get("PORT","5000")))
