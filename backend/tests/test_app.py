import pytest
from app import create_app
@pytest.fixture
def client(tmp_path):
 app=create_app({"TESTING":True,"DATABASE":str(tmp_path/"test.db")})
 with app.test_client() as c: yield c
def test_health(client):
 r=client.get("/api/health"); assert r.status_code==200 and r.json["status"]=="ok"
def test_create_list(client):
 r=client.post("/api/requests",json={"title":"Login issue","description":"Cannot sign in","priority":"High"}); assert r.status_code==201
 assert client.get("/api/requests").json[0]["title"]=="Login issue"
def test_validation(client):
 r=client.post("/api/requests",json={"title":"Login issue","description":"Cannot sign in","priority":"Urgent"}); assert r.status_code==400
def test_status_update_and_missing(client):
 r=client.post("/api/requests",json={"title":"Broken page","description":"Page does not load","priority":"Medium"}); i=r.json["id"]
 assert client.patch(f"/api/requests/{i}",json={"status":"Resolved"}).json["status"]=="Resolved"
 assert client.patch("/api/requests/999",json={"status":"Resolved"}).status_code==404
