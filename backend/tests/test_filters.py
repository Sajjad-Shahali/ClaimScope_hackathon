def test_filters(client):
    response = client.get("/filters")
    assert response.status_code == 200
    payload = response.json()
    assert "POWERTRAIN" in payload["warranties"]
    assert payload["claim_date_min"] == "2024-01-15"


def test_filters_lists(client):
    payload = client.get("/filters").json()
    assert "GAUTENG" in payload["regions"]
    assert "TOYOTA" in payload["brands"]
