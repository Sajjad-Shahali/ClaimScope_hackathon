def test_claims_list(client):
    response = client.get("/claims", params={"page": 1, "page_size": 2})
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["items"]) == 2
    assert payload["pagination"]["total_records"] == 5


def test_claim_detail(client):
    response = client.get("/claims/C002")
    assert response.status_code == 200
    payload = response.json()
    assert payload["claim_id"] == "C002"
    assert payload["anomaly_components"]["anomaly_flag"] is True


def test_claim_not_found(client):
    response = client.get("/claims/NOPE")
    assert response.status_code == 404


def test_claims_bad_sort(client):
    response = client.get("/claims", params={"sort_by": "unknown"})
    assert response.status_code == 422
