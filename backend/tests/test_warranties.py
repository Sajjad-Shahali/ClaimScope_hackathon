def test_warranties_overview(client):
    response = client.get("/warranties/overview")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) >= 2


def test_warranty_detail_not_found(client):
    response = client.get("/warranties/UNKNOWN")
    assert response.status_code == 404
