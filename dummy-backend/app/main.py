from fastapi import FastAPI

app = FastAPI(title="Dummy Backend")

DUMMY_RESULTS = {
    "items": [
        {
            "id": 1,
            "asset_tag": "LAP-1001",
            "name": "Demo Laptop",
            "status": "available",
            "owner": "Alice Johnson",
            "location": "New York"
        },
        {
            "id": 2,
            "asset_tag": "MON-2004",
            "name": "27 inch Monitor",
            "status": "assigned",
            "owner": "Bob Smith",
            "location": "Chicago"
        },
        {
            "id": 3,
            "asset_tag": "PHN-3007",
            "name": "Test Mobile Device",
            "status": "repair",
            "owner": "Carol Davis",
            "location": "San Francisco"
        }
    ],
    "total": 3,
    "page": 1,
    "page_size": 50
}


@app.get("/health")
def health():
    return {"status": "ok", "service": "dummy-backend"}


@app.get("/api/v1/dummy-assets")
def get_dummy_assets():
    return DUMMY_RESULTS
