def _auth_headers(client, email="tasks@example.com", password="senha12345"):
    client.post("/auth/register", json={"email": email, "password": password})
    login_response = client.post("/auth/login", data={"username": email, "password": password})
    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_task_crud_flow(client):
    headers = _auth_headers(client)

    create_response = client.post(
        "/tasks", json={"title": "Escrever testes", "description": "cobrir o crud"}, headers=headers
    )
    assert create_response.status_code == 201
    task = create_response.json()
    assert task["is_done"] is False

    list_response = client.get("/tasks", headers=headers)
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    update_response = client.patch(f"/tasks/{task['id']}", json={"is_done": True}, headers=headers)
    assert update_response.status_code == 200
    assert update_response.json()["is_done"] is True

    delete_response = client.delete(f"/tasks/{task['id']}", headers=headers)
    assert delete_response.status_code == 204

    empty_list_response = client.get("/tasks", headers=headers)
    assert empty_list_response.json() == []


def test_tasks_require_authentication(client):
    response = client.get("/tasks")
    assert response.status_code == 401


def test_tasks_are_scoped_per_user(client):
    headers_a = _auth_headers(client, email="a@example.com")
    headers_b = _auth_headers(client, email="b@example.com")

    client.post("/tasks", json={"title": "Tarefa da A", "description": ""}, headers=headers_a)

    response_b = client.get("/tasks", headers=headers_b)
    assert response_b.status_code == 200
    assert response_b.json() == []


def test_update_and_delete_of_unknown_task_returns_404(client):
    headers = _auth_headers(client)

    assert client.patch("/tasks/999", json={"is_done": True}, headers=headers).status_code == 404
    assert client.delete("/tasks/999", headers=headers).status_code == 404
