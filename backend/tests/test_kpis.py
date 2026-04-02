def test_kpis(client):
    response = client.get("/kpis")
    assert response.status_code == 200
    payload = response.json()
    assert payload["kpis"]["total_claims"] == 5
    assert payload["kpis"]["anomaly_count"] == 1


def test_kpis_comparison(client):
    response = client.get("/kpis", params={"start_date": "2024-03-01", "end_date": "2024-03-31"})
    assert response.status_code == 200
    assert response.json()["comparison"] is not None
