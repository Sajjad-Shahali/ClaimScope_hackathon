def test_anomalies(client):
    response = client.get("/anomalies")
    assert response.status_code == 200
    payload = response.json()
    assert payload["items"][0]["claim_id"] == "C002"


def test_anomaly_summary(client):
    response = client.get("/anomalies/summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["anomaly_count"] >= 1


def test_anomaly_threshold_filter(client):
    response = client.get("/anomalies", params={"min_anomaly_score": 0.9})
    assert response.status_code == 200
    assert all(item["anomaly_score"] >= 0.9 for item in response.json()["items"])
