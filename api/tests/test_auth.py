def test_register_and_login_flow(client):
    register_response = client.post("/auth/register", json={"email": "user@example.com", "password": "senha12345"})
    assert register_response.status_code == 201
    assert register_response.json()["email"] == "user@example.com"

    duplicate_response = client.post(
        "/auth/register", json={"email": "user@example.com", "password": "senha12345"}
    )
    assert duplicate_response.status_code == 409

    login_response = client.post("/auth/login", data={"username": "user@example.com", "password": "senha12345"})
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "user@example.com"


def test_login_with_wrong_password_is_rejected(client):
    client.post("/auth/register", json={"email": "user2@example.com", "password": "senha12345"})

    response = client.post("/auth/login", data={"username": "user2@example.com", "password": "senha-errada"})
    assert response.status_code == 401


def test_me_requires_a_valid_token(client):
    response = client.get("/auth/me", headers={"Authorization": "Bearer token-invalido"})
    assert response.status_code == 401
