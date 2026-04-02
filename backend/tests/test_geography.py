def test_geography_overview(client):
    response = client.get("/geography/overview")
    assert response.status_code == 200
    payload = response.json()
    assert "regions" in payload
    assert "provinces" in payload


def test_region_detail(client):
    response = client.get("/geography/region/GAUTENG")
    assert response.status_code == 200
    assert response.json()["geography_name"] == "GAUTENG"
